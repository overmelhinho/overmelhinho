<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Autorizacao;
use App\Models\AutorizacaoParcela;
use App\Models\Cliente;
use App\Models\Invoice;
use App\Services\TinyErpService;
use App\Services\ZApiService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class AutorizacaoController extends Controller
{
    // ─── Listagem ─────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        // ✅ Auto-healing: Corrige números sem o padding de 5 dígitos (ex: 006-4 -> 00006-4)
        static $healed = false;
        if (!$healed) {
            $toFix = Autorizacao::whereRaw("length(split_part(numero, '-', 1)) < 5")->get();
            foreach ($toFix as $a) {
                $parts = explode('-', (string)$a->numero);
                $newNum = str_pad($parts[0], 5, '0', STR_PAD_LEFT);
                if (isset($parts[1])) $newNum .= '-' . $parts[1];
                
                try {
                    $a->update(['numero' => $newNum]);
                } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                    // Se houver colisão de número (ex: múltiplos cadastros com numero 0), gera um novo
                    $a->update(['numero' => Autorizacao::proximoNumero()]);
                }
            }
            $healed = true;
        }

        $query = Autorizacao::with(['cliente:id,nome_fantasia,cpf_cnpj', 'vendedor:id,name', 'plan'])
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_start')) {
            $query->whereDate('created_at', '>=', $request->date_start);
        }
        if ($request->filled('date_end')) {
            $query->whereDate('created_at', '<=', $request->date_end);
        }
        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }
        if ($request->filled('q')) {
            $q = $request->q;

            static $unaccentExists = null;
            if ($unaccentExists === null) {
                try {
                    \Illuminate\Support\Facades\DB::select("SELECT unaccent('a')");
                    $unaccentExists = true;
                } catch (\Exception $e) {
                    $unaccentExists = false;
                }
            }

            $query->where(function ($sq) use ($q, $unaccentExists) {
                if ($unaccentExists) {
                    $sq->whereRaw("unaccent(titulo_anuncio) ilike unaccent(?)", ["%{$q}%"])
                        ->orWhereHas('cliente', fn($c) => $c->whereRaw("unaccent(nome_fantasia) ilike unaccent(?)", ["%{$q}%"]));
                } else {
                    $sq->where('titulo_anuncio', 'ilike', "%{$q}%")
                        ->orWhereHas('cliente', fn($c) => $c->where('nome_fantasia', 'ilike', "%{$q}%"));
                }

                // Busca por número do contrato (removendo # e zeros à esquerda para conferir com o integer no DB)
                $numericQ = preg_replace('/\D/', '', $q);
                if ($numericQ !== '') {
                    $sq->orWhere('numero', 'ilike', "%{$q}%");
                }
            });
        }

        return response()->json($query->paginate(20));
    }

    // ─── Criar ────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id'            => 'required|exists:clientes,id',
            'tipo_publicidade'      => 'required|string|max:100',
            'titulo_anuncio'        => 'required|string|max:255',
            'descricao_anuncio'     => 'nullable|string',
            'valor_total'           => 'required|numeric|min:0',
            'taxa_cadastro'         => 'nullable|numeric|min:0',
            'data_inicio'           => 'required|date',
            'data_fim'              => 'required|date|after:data_inicio',
            'modo_pagamento'        => 'required|in:direto,parcelado',
            'num_parcelas'          => 'required|integer|min:1|max:36',
            'data_primeira_parcela' => 'required|date',
            'payment_method'        => 'nullable|in:pix,boleto,cartao,dinheiro',
            'observacoes_anuncio'   => 'nullable|string',
            'observacoes_financeiro'=> 'nullable|string',
            'plan_id'               => 'nullable|exists:plans,id',
            'is_permuta'            => 'nullable|boolean',
            'permuta_amount'        => 'nullable|numeric|min:0',
            'permuta_description'   => 'nullable|string',
            'desconto_tipo'         => 'nullable|string|in:fixed,percent',
            'desconto_valor'          => 'nullable|numeric|min:0',
            'parcelas'                => 'nullable|array',
            'parcelas.*.vencimento'   => 'required|date',
            'responsavel_nome'        => 'nullable|string|max:255',
            'responsavel_preferencia' => 'nullable|string|max:255',
            'responsavel_turno'       => 'nullable|string|max:255',
            'parent_id'               => 'nullable|exists:autorizacoes,id',
            'is_bonificacao'          => 'nullable|boolean',
        ]);

        if (!empty($validated['parent_id'])) {
            $parent = Autorizacao::find($validated['parent_id']);
            $count = Autorizacao::where('parent_id', $parent->id)->count();
            $parentNum = preg_replace('/\D/', '', (string) $parent->numero);
            $validated['numero'] = str_pad($parentNum, 5, '0', STR_PAD_LEFT) . '-' . ($count + 2);
            $validated['is_bonificacao'] = true;
            $validated['valor_total'] = 0;
            $validated['taxa_cadastro'] = 0;
            $validated['permuta_amount'] = 0;

            // Herdar assinatura do pai
            if ($parent->status === 'assinado') {
                $validated['status'] = 'assinado';
                $validated['assinado_em'] = $parent->assinado_em;
                $validated['assinatura_ip'] = $parent->assinatura_ip;
                $validated['assinatura_base64'] = $parent->assinatura_base64;
                $validated['justificativa_assinatura'] = $parent->justificativa_assinatura;
                $validated['justificado_por'] = $parent->justificado_por;
            } else {
                $validated['status'] = 'rascunho';
            }
        } else {
            $validated['numero']      = Autorizacao::proximoNumero();
            $validated['status']      = 'rascunho';
        }

        $validated['vendedor_id'] = Auth::id();
        $validated['taxa_cadastro'] = $validated['taxa_cadastro'] ?? 0;
        $validated['payment_method'] = $validated['payment_method'] ?? 'pix';
        $validated['is_permuta'] = $request->boolean('is_permuta') ? 'true' : 'false';
        if (isset($validated['is_bonificacao'])) {
            $validated['is_bonificacao'] = $request->boolean('is_bonificacao') ? 'true' : 'false';
        }

        $autorizacao = Autorizacao::create($validated);

        // ✅ Sincroniza com o mestre do Cliente
        $cliente = Cliente::find($validated['cliente_id']);
        if ($cliente) {
            $cliente->update([
                'contact_preference' => $validated['responsavel_preferencia'] ?? $cliente->contact_preference,
                'best_contact_shift' => $validated['responsavel_turno'] ?? $cliente->best_contact_shift,
                'responsavel'        => $validated['responsavel_nome'] ?? $cliente->responsavel,
            ]);
        }

        // Gera parcelas (automatica ou customizada)
        $this->gerarParcelas($autorizacao, $request->input('parcelas', []));

        // Se herdou a assinatura, gera o PDF imediatamente
        if ($autorizacao->status === 'assinado') {
            try {
                $autorizacaoFull = $autorizacao->fresh()->load(['cliente.enderecos', 'cliente.contatos', 'vendedor', 'parcelas', 'justificadoPor']);
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.autorizacao', ['autorizacao' => $autorizacaoFull])
                    ->setPaper('a4', 'portrait')
                    ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);
                $filename = "autorizacoes/autorizacao-{$autorizacao->numero}-assinada.pdf";
                \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $pdf->output());
                $autorizacao->update(['pdf_path' => $filename]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Erro ao gerar PDF da bonificação assinada: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $autorizacao->load(['parcelas', 'cliente', 'vendedor']),
        ], 201);
    }

    // ─── Exibir ───────────────────────────────────────────────────────────────

    public function show($id)
    {
        $autorizacao = Autorizacao::with(['cliente.enderecos', 'cliente.contatos', 'vendedor', 'parcelas'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $autorizacao]);
    }

    // ─── Atualizar ────────────────────────────────────────────────────────────

    public function update(Request $request, $id)
    {
        $autorizacao = Autorizacao::findOrFail($id);

        // Removida restrição para permitir edição administrativa mesmo após assinado

        $validated = $request->validate([
            'tipo_publicidade'      => 'sometimes|string|max:100',
            'titulo_anuncio'        => 'sometimes|string|max:255',
            'descricao_anuncio'     => 'nullable|string',
            'valor_total'           => 'sometimes|numeric|min:0',
            'taxa_cadastro'         => 'nullable|numeric|min:0',
            'data_inicio'           => 'sometimes|date',
            'data_fim'              => 'sometimes|date|after:data_inicio',
            'modo_pagamento'        => 'sometimes|in:direto,parcelado',
            'num_parcelas'          => 'sometimes|integer|min:1|max:36',
            'data_primeira_parcela' => 'sometimes|date',
            'payment_method'        => 'nullable|in:pix,boleto,cartao,dinheiro',
            'observacoes_anuncio'   => 'nullable|string',
            'observacoes_financeiro'=> 'nullable|string',
            'plan_id'               => 'nullable|exists:plans,id',
            'is_permuta'            => 'nullable|boolean',
            'permuta_amount'        => 'nullable|numeric|min:0',
            'permuta_description'   => 'nullable|string',
            'desconto_tipo'         => 'nullable|string|in:fixed,percent',
            'desconto_valor'          => 'nullable|numeric|min:0',
            'parcelas'                => 'nullable|array',
            'parcelas.*.vencimento'   => 'required|date',
            'responsavel_nome'        => 'nullable|string|max:255',
            'responsavel_preferencia' => 'nullable|string|max:255',
            'responsavel_turno'       => 'nullable|string|max:255',
        ]);

        if ($request->has('is_permuta')) {
            $validated['is_permuta'] = $request->boolean('is_permuta') ? 'true' : 'false';
        }

        $autorizacao->update($validated);

        // ✅ Sincroniza com o mestre do Cliente
        $cliente = $autorizacao->cliente;
        if ($cliente) {
            $updateClient = [];
            if (isset($validated['responsavel_preferencia'])) $updateClient['contact_preference'] = $validated['responsavel_preferencia'];
            if (isset($validated['responsavel_turno'])) $updateClient['best_contact_shift'] = $validated['responsavel_turno'];
            if (isset($validated['responsavel_nome'])) $updateClient['responsavel'] = $validated['responsavel_nome'];
            
            if (!empty($updateClient)) {
                $cliente->update($updateClient);
            }
        }

        // Se mudar algo financeiro, regera as parcelas e limpa faturas antigas (preservando as pagas por segurança)
        if ($request->hasAny(['valor_total', 'taxa_cadastro', 'num_parcelas', 'is_permuta', 'permuta_amount', 'desconto_valor', 'desconto_tipo', 'data_primeira_parcela', 'parcelas'])) {
            
            // Limpa faturas PENDENTES vinculadas a esta autorização
            // Usamos patterns variados de group_id para garantir a limpeza
            \App\Models\Invoice::where(function($q) use ($autorizacao) {
                $q->where('group_id', 'autorizacao-' . $autorizacao->id)
                  ->orWhere('group_id', (string)$autorizacao->id);
            })
            ->where('status', '!=', 'paid') // Não deletamos o que já foi pago para não perder rastro financeiro
            ->delete();
            
            $autorizacao->parcelas()->delete();
            $this->gerarParcelas($autorizacao->fresh(), $request->input('parcelas', []));

            // Se o contrato já estiver assinado, regera as faturas (Invoices) imediatamente
            if ($autorizacao->status === 'assinado') {
                try {
                    $tinyService = app(\App\Services\TinyErpService::class);
                    $this->processInvoiceGeneration($autorizacao->fresh(['parcelas', 'cliente']), $tinyService);
                } catch (\Exception $e) {
                    \Log::error("Erro ao regerar faturas após edição da autorização #{$autorizacao->id}: " . $e->getMessage());
                }
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $autorizacao->fresh()->load(['parcelas', 'cliente', 'vendedor']),
        ]);
    }

    public function destroy($id)
    {
        $autorizacao = Autorizacao::findOrFail($id);


        // Remove todas as faturas geradas por esta autorização
        Invoice::where('group_id', 'autorizacao-' . $autorizacao->id)->delete();

        $autorizacao->parcelas()->delete();
        $autorizacao->delete();

        return response()->json(['success' => true]);
    }

    // ─── Cancelar ─────────────────────────────────────────────────────────────

    public function cancel($id)
    {
        $autorizacao = Autorizacao::findOrFail($id);
        $autorizacao->update(['status' => 'cancelado']);
        return response()->json(['success' => true]);
    }

    // ─── Gerar PDF ────────────────────────────────────────────────────────────

    public function generatePdf($id)
    {
        $autorizacao = Autorizacao::with(['cliente.enderecos', 'cliente.contatos', 'vendedor', 'parcelas'])
            ->findOrFail($id);

        $pdf = Pdf::loadView('pdf.autorizacao', ['autorizacao' => $autorizacao])
            ->setPaper('a4', 'portrait')
            ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);

        $filename = "autorizacoes/autorizacao-{$autorizacao->numero}.pdf";
        Storage::disk('public')->put($filename, $pdf->output());

        $autorizacao->update(['pdf_path' => $filename]);

        return $pdf->download("autorizacao-{$autorizacao->numero}.pdf");
    }

    // ─── Visualizar PDF (sem download) ────────────────────────────────────────

    public function previewPdf($id)
    {
        $autorizacao = Autorizacao::with(['cliente.enderecos', 'cliente.contatos', 'vendedor', 'parcelas'])
            ->findOrFail($id);

        $pdf = Pdf::loadView('pdf.autorizacao', ['autorizacao' => $autorizacao])
            ->setPaper('a4', 'portrait')
            ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);

        return $pdf->stream("autorizacao-{$autorizacao->numero}.pdf");
    }

    // ─── Enviar Link de Assinatura ────────────────────────────────────────────

    public function sendLink(Request $request, $id, ZApiService $zapi)
    {
        $autorizacao = Autorizacao::with(['cliente.contatos', 'cliente.enderecos'])->findOrFail($id);

        $token = Str::random(64);
        $autorizacao->update([
            'magic_link_token' => $token,
            'status'           => 'aguardando_assinatura',
        ]);

        // Fallback inteligente para URL do front
        $frontendUrl = config('app.frontend_url');
        $host = $request->header('origin') ?: $request->header('referer') ?: 'localhost';
        
        if (str_contains($frontendUrl, 'localhost') && !str_contains($host, 'localhost') && !str_contains($host, '127.0.0.1')) {
            $frontendUrl = 'https://dash.overmelhinho.com.br';
        }
        $link = $frontendUrl . "/autorizar/{$token}";

        $phone = $autorizacao->cliente->contatos->firstWhere('principal', true)->celular ?? $autorizacao->cliente->contatos->first()->celular ?? null;
        
        $whatsappSent = false;
        if ($phone && $request->boolean('send_whatsapp', true)) {
            $unmaskedPhone = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($unmaskedPhone) >= 10) {
                $message = "Olá, *{$autorizacao->cliente->nome_fantasia}*!\n\n";
                $message .= "Sua proposta de publicidade *#{$autorizacao->numero}* (_{$autorizacao->titulo_anuncio}_) foi gerada com sucesso.\n\n";
                $message .= "Para visualizar o resumo e realizar a assinatura digital segura, acesse o link abaixo:\n";
                $message .= "👉 {$link}\n\n";
                $message .= "*Equipe O Vermelhinho*";
                
                $whatsappSent = $zapi->sendText($unmaskedPhone, $message);
            }
        }

        Log::info("Link de assinatura gerado para autorização #{$autorizacao->numero}", [
            'link'           => $link,
            'whatsapp_sent'  => $whatsappSent,
            'autorizacao_id' => $autorizacao->id,
        ]);

        return response()->json([
            'success'   => true,
            'link'      => $link,
            'whatsapp'  => $whatsappSent,
            'message'   => $whatsappSent 
                ? 'Link gerado e enviado via WhatsApp!' 
                : 'Link de assinatura gerado. Envie ao cliente via WhatsApp ou e-mail.',
        ]);
    }

    // ─── Rota Pública: Dados para Assinatura ─────────────────────────────────

    public function showByToken($token)
    {
        $autorizacao = Autorizacao::with([
            'cliente.enderecos',
            'cliente.contatos',
            'vendedor:id,name',
            'parcelas',
        ])
            ->where('magic_link_token', $token)
            ->whereIn('status', ['aguardando_assinatura'])
            ->firstOrFail();

        return response()->json(['success' => true, 'data' => $autorizacao]);
    }

    // ─── Rota Pública: Aceitar / Assinar ─────────────────────────────────────

    public function sign(Request $request, $token)
    {
        $autorizacao = Autorizacao::with('parcelas')
            ->where('magic_link_token', $token)
            ->where('status', 'aguardando_assinatura')
            ->firstOrFail();

        $request->validate([
            'assinatura_base64' => 'nullable|string',
        ]);

        $autorizacao->update([
            'status'           => 'assinado',
            'assinado_em'      => now(),
            'assinatura_ip'    => $request->ip(),
            'assinatura_base64'=> $request->assinatura_base64,
        ]);

        // Gera PDF final com assinatura e salva
        try {
            $autorizacaoFull = $autorizacao->fresh()->load(['cliente.enderecos', 'cliente.contatos', 'vendedor', 'parcelas']);
            $pdf = Pdf::loadView('pdf.autorizacao', ['autorizacao' => $autorizacaoFull])
                ->setPaper('a4', 'portrait')
                ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);
            $filename = "autorizacoes/autorizacao-{$autorizacao->numero}-assinada.pdf";
            Storage::disk('public')->put($filename, $pdf->output());
            $autorizacao->update(['pdf_path' => $filename]);
        } catch (\Exception $e) {
            Log::error('Erro ao gerar PDF pós-assinatura: ' . $e->getMessage());
        }

        Log::info("Autorização #{$autorizacao->numero} assinada.", [
            'ip' => $request->ip(),
        ]);

        // Automação: Gerar faturas no Tiny imediatamente após a assinatura
        try {
            $tinyService = app(TinyErpService::class);
            $this->processInvoiceGeneration($autorizacao->fresh(['parcelas', 'cliente']), $tinyService);
        } catch (\Exception $e) {
            Log::error("Erro na automação pós-assinatura da autorização #{$autorizacao->id}: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Contrato assinado com sucesso! Em breve nossa equipe entrará em contato.',
        ]);
    }

    // ─── Justificar Assinatura (Admin) ───────────────────────────────────────

    public function justify(Request $request, $id)
    {
        $autorizacao = Autorizacao::findOrFail($id);

        if ($autorizacao->status !== 'aguardando_assinatura') {
            return response()->json(['message' => 'A autorização não está pendente de assinatura.'], 422);
        }

        $request->validate([
            'justificativa' => 'required|string|min:5',
        ]);

        $autorizacao->update([
            'status'                   => 'assinado',
            'assinado_em'              => now(),
            'justificativa_assinatura' => $request->justificativa,
            'justificado_por'          => auth()->id(),
            'assinatura_ip'            => $request->ip(),
        ]);

        // Gera PDF final com justificativa e salva
        try {
            $autorizacaoFull = $autorizacao->fresh()->load(['cliente.enderecos', 'cliente.contatos', 'vendedor', 'justificadoPor', 'parcelas']);
            $pdf = Pdf::loadView('pdf.autorizacao', ['autorizacao' => $autorizacaoFull])
                ->setPaper('a4', 'portrait')
                ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);
            $filename = "autorizacoes/autorizacao-{$autorizacao->numero}-justificada.pdf";
            Storage::disk('public')->put($filename, $pdf->output());
            $autorizacao->update(['pdf_path' => $filename]);
        } catch (\Exception $e) {
            Log::error('Erro ao gerar PDF pós-justificativa: ' . $e->getMessage());
        }

        // Automação: Gerar faturas no Tiny imediatamente
        try {
            $tinyService = app(TinyErpService::class);
            $this->processInvoiceGeneration($autorizacao->fresh(['parcelas', 'cliente']), $tinyService);
        } catch (\Exception $e) {
            Log::error("Erro na automação pós-justificativa da autorização #{$autorizacao->id}: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Contrato assinado via justificativa com sucesso!',
        ]);
    }

    // ─── Gerar Invoices após Assinatura (Admin ou Auto) ───────────────────────

    public function generateInvoices($id, TinyErpService $tinyService)
    {
        $autorizacao = Autorizacao::with(['cliente', 'parcelas'])->findOrFail($id);

        if ($autorizacao->status !== 'assinado') {
            return response()->json(['message' => 'A autorização precisa estar assinada.'], 422);
        }

        $result = $this->processInvoiceGeneration($autorizacao, $tinyService);

        return response()->json([
            'success'            => true,
            'message'            => $result['total_processed'] > 0 ? 'Faturas processadas com sucesso.' : 'Todas as faturas já estavam sincronizadas.',
            'invoices_criadas'   => count($result['created']),
            'invoices_sincronizadas' => count($result['synced']),
            'total_processed'    => $result['total_processed'],
            'invoice_ids'        => array_merge($result['created'], $result['synced']),
        ]);
    }

    /**
     * Lógica central de geração de invoices para evitar repetição
     */
    private function processInvoiceGeneration(Autorizacao $autorizacao, TinyErpService $tinyService): array
    {
        $createdIds = [];
        $syncedIds = [];

        foreach ($autorizacao->parcelas as $parcela) {
            $invoice = null;

            if ($parcela->invoice_id) {
                $invoice = Invoice::find($parcela->invoice_id);
            }

            if (!$invoice) {
                $invoice = Invoice::create([
                    'client_id'      => $autorizacao->cliente_id,
                    'plan_id'        => $autorizacao->plan_id,
                    'amount'         => $parcela->valor,
                    'payable_amount' => $parcela->payable_amount,
                    'is_permuta'     => filter_var($autorizacao->is_permuta, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false',
                    'permuta_amount' => $parcela->permuta_amount,
                    'permuta_description' => $autorizacao->permuta_description,
                    'due_date'       => $parcela->vencimento,
                    'status'         => 'pending',
                    'payment_method' => $autorizacao->payment_method,
                    'parcel_number'  => $parcela->numero,
                    'total_parcels'  => $autorizacao->num_parcelas,
                    'group_id'       => 'autorizacao-' . $autorizacao->id,
                ]);
                $parcela->update(['invoice_id' => $invoice->id, 'status' => 'pendente']);
                $createdIds[] = $invoice->id;
            }

            // Envia ao Tiny se ainda não tiver ID lá
            if ($invoice && !$invoice->tiny_account_id) {
                try {
                    $tinyData = $tinyService->createReceivable($invoice);
                    $invoice->update([
                        'tiny_account_id' => $tinyData['tiny_account_id'],
                        'payment_url'     => $tinyData['payment_url'],
                    ]);
                    
                    if (!in_array($invoice->id, $createdIds)) {
                        $syncedIds[] = $invoice->id;
                    }
                } catch (\Exception $e) {
                    Log::error("Erro ao enviar parcela {$parcela->numero} da autorização #{$autorizacao->numero} ao Tiny: " . $e->getMessage());
                }
            }
        }

        return [
            'created' => $createdIds,
            'synced'  => $syncedIds,
            'total_processed' => count($createdIds) + count($syncedIds)
        ];
    }
    
    // ─── Download em Lote (Zip) ────────────────────────────────────────────────
    
    public function downloadBatch(Request $request)
    {
        $ids = $request->input('ids');
        if (!$ids || !is_array($ids)) {
            return response()->json(['message' => 'Nenhum contrato selecionado.'], 422);
        }

        $autorizacoes = Autorizacao::with(['cliente.enderecos', 'cliente.contatos', 'vendedor', 'parcelas'])
            ->whereIn('id', $ids)
            ->get();

        if ($autorizacoes->isEmpty()) {
            return response()->json(['message' => 'Contratos não encontrados.'], 404);
        }

        $tempDir = storage_path('app/public/temp/' . now()->format('YmdHis') . '_' . uniqid());
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $pdfFiles = [];
        foreach ($autorizacoes as $aut) {
            $pdf = Pdf::loadView('pdf.autorizacao', ['autorizacao' => $aut])
                ->setPaper('a4', 'portrait')
                ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);
            
            $filename = "contrato_" . str_pad($aut->numero, 5, '0', STR_PAD_LEFT) . ".pdf";
            $fullPath = $tempDir . DIRECTORY_SEPARATOR . $filename;
            file_put_contents($fullPath, $pdf->output());
            $pdfFiles[] = $fullPath;
        }

        $zipName = 'contratos_' . now()->format('YmdHis') . '.zip';
        $zipPath = storage_path('app/public/temp/' . $zipName);

        if (class_exists('\ZipArchive')) {
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
                foreach ($pdfFiles as $path) {
                    $zip->addFile($path, basename($path));
                }
                $zip->close();
            }
        } else {
            // Fallback para Windows usando PowerShell se ZipArchive não estiver instalado
            $quotedFiles = array_map(fn($f) => "'$f'", $pdfFiles);
            $filesList = implode(',', $quotedFiles);
            
            $cmd = "powershell -Command \"Compress-Archive -Path $filesList -DestinationPath '$zipPath' -Force\"";
            exec($cmd, $output, $returnCode);

            if ($returnCode !== 0) {
                Log::error("Falha ao criar ZIP via PowerShell", ['cmd' => $cmd, 'output' => $output]);
                return response()->json(['message' => 'Falha ao gerar arquivo ZIP no servidor.'], 500);
            }
        }

        // Limpa os arquivos individuais (mantendo a pasta principal de temp limpa)
        foreach ($pdfFiles as $f) { @unlink($f); }
        @rmdir($tempDir);

        if (!file_exists($zipPath)) {
            return response()->json(['message' => 'Arquivo ZIP não foi gerado.'], 500);
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    // ─── Helper: Gerar Parcelas ───────────────────────────────────────────────

    protected function gerarParcelas(Autorizacao $autorizacao, array $customParcelas = []): void
    {
        $basePrice = $autorizacao->valor_total;
        $discountAmount = 0;

        if ($autorizacao->desconto_tipo === 'fixed') {
            $discountAmount = $autorizacao->desconto_valor;
        } elseif ($autorizacao->desconto_tipo === 'percent') {
            $discountAmount = ($basePrice * $autorizacao->desconto_valor) / 100;
        }

        $priceAfterDiscount = max(0, $basePrice - $discountAmount);
        $totalComTaxa = $priceAfterDiscount + $autorizacao->taxa_cadastro;
        $permutaTotal = $autorizacao->is_permuta ? $autorizacao->permuta_amount : 0;

        $numParcelas = max(1, $autorizacao->num_parcelas);

        // Se foram enviadas parcelas customizadas, garantir que condiz com o num_parcelas
        // Se não for compatível, ignoramos e geramos o padrão.
        $hasCustomDates = count($customParcelas) === $numParcelas;

        // Parcelamento do valor Bruto (com taxa e após desconto)
        $valorParcelaBruta = round($totalComTaxa / $numParcelas, 2);
        $diferencaBruta    = round($totalComTaxa - ($valorParcelaBruta * $numParcelas), 2);

        // Parcelamento da permuta
        $valorParcelaPermuta = round($permutaTotal / $numParcelas, 2);
        $diferencaPermuta    = round($permutaTotal - ($valorParcelaPermuta * $numParcelas), 2);

        $primeiroVenc = Carbon::parse($autorizacao->data_primeira_parcela);

        for ($i = 1; $i <= $numParcelas; $i++) {
            $vBruto   = $valorParcelaBruta + ($i === $numParcelas ? $diferencaBruta : 0);
            $vPermuta = $valorParcelaPermuta + ($i === $numParcelas ? $diferencaPermuta : 0);
            $vPayable = max(0, $vBruto - $vPermuta);
            
            // Define o vencimento: customizado ou sequencial (mensal)
            $vencimento = $hasCustomDates 
                ? Carbon::parse($customParcelas[$i-1]['vencimento'])->format('Y-m-d')
                : $primeiroVenc->copy()->addMonths($i - 1)->format('Y-m-d');

            AutorizacaoParcela::create([
                'autorizacao_id' => $autorizacao->id,
                'numero'         => $i,
                'vencimento'     => $vencimento,
                'valor'          => $vBruto,
                'permuta_amount' => $vPermuta,
                'payable_amount' => $vPayable,
                'status'         => 'pendente',
            ]);
        }
    }
}
