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
        $query = Autorizacao::with(['cliente:id,nome_fantasia,cpf_cnpj', 'vendedor:id,name', 'plan'])
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sq) use ($q) {
                $sq->where('titulo_anuncio', 'ilike', "%{$q}%")
                    ->orWhereHas('cliente', fn($c) => $c->where('nome_fantasia', 'ilike', "%{$q}%"));
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
            'desconto_valor'        => 'nullable|numeric|min:0',
        ]);

        $validated['numero']      = Autorizacao::proximoNumero();
        $validated['vendedor_id'] = Auth::id();
        $validated['taxa_cadastro'] = $validated['taxa_cadastro'] ?? 0;
        $validated['payment_method'] = $validated['payment_method'] ?? 'pix';
        $validated['status']      = 'rascunho';

        $autorizacao = Autorizacao::create($validated);

        // Gera parcelas automaticamente
        $this->gerarParcelas($autorizacao);

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

        if (!in_array($autorizacao->status, ['rascunho'])) {
            return response()->json(['message' => 'Apenas rascunhos podem ser editados.'], 422);
        }

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
            'desconto_valor'        => 'nullable|numeric|min:0',
        ]);

        $autorizacao->update($validated);

        // Se mudar algo financeiro, regera as parcelas
        if ($request->hasAny(['valor_total', 'taxa_cadastro', 'num_parcelas', 'is_permuta', 'permuta_amount', 'desconto_valor', 'desconto_tipo', 'data_primeira_parcela'])) {
            $autorizacao->parcelas()->delete();
            $this->gerarParcelas($autorizacao->fresh());
        }

        return response()->json([
            'success' => true,
            'data'    => $autorizacao->fresh()->load(['parcelas', 'cliente', 'vendedor']),
        ]);
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
            ->setPaper('a4', 'portrait');

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
            ->setPaper('a4', 'portrait');

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

        $link = config('app.frontend_url') . "/autorizar/{$token}";

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
                ->setPaper('a4', 'portrait');
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

    // ─── Gerar Invoices após Assinatura (Admin ou Auto) ───────────────────────

    public function generateInvoices($id, TinyErpService $tinyService)
    {
        $autorizacao = Autorizacao::with(['cliente', 'parcelas'])->findOrFail($id);

        if ($autorizacao->status !== 'assinado') {
            return response()->json(['message' => 'A autorização precisa estar assinada.'], 422);
        }

        $created = $this->processInvoiceGeneration($autorizacao, $tinyService);

        return response()->json([
            'success'          => true,
            'invoices_criadas' => count($created),
            'invoice_ids'      => $created,
        ]);
    }

    /**
     * Lógica central de geração de invoices para evitar repetição
     */
    private function processInvoiceGeneration(Autorizacao $autorizacao, TinyErpService $tinyService): array
    {
        $created = [];

        foreach ($autorizacao->parcelas as $parcela) {
            if ($parcela->invoice_id) continue; // já tem invoice

            $invoice = Invoice::create([
                'client_id'      => $autorizacao->cliente_id,
                'plan_id'        => $autorizacao->plan_id,
                'amount'         => $parcela->valor,
                'payable_amount' => $parcela->payable_amount,
                'is_permuta'     => $autorizacao->is_permuta,
                'permuta_amount' => $parcela->permuta_amount,
                'permuta_description' => $autorizacao->permuta_description,
                'due_date'       => $parcela->vencimento,
                'status'         => 'pending',
                'payment_method' => $autorizacao->payment_method,
                'parcel_number'  => $parcela->numero,
                'total_parcels'  => $autorizacao->num_parcelas,
                'group_id'       => 'autorizacao-' . $autorizacao->id,
            ]);

            // Envia ao Tiny
            try {
                $tinyData = $tinyService->createReceivable($invoice);
                $invoice->update([
                    'tiny_account_id' => $tinyData['tiny_account_id'],
                    'payment_url'     => $tinyData['payment_url'],
                ]);
            } catch (\Exception $e) {
                Log::error("Erro ao enviar parcela {$parcela->numero} da autorização #{$autorizacao->numero} ao Tiny: " . $e->getMessage());
            }

            $parcela->update(['invoice_id' => $invoice->id, 'status' => 'pendente']);
            $created[] = $invoice->id;
        }

        return $created;
    }

    // ─── Helper: Gerar Parcelas ───────────────────────────────────────────────

    protected function gerarParcelas(Autorizacao $autorizacao): void
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

            AutorizacaoParcela::create([
                'autorizacao_id' => $autorizacao->id,
                'numero'         => $i,
                'vencimento'     => $primeiroVenc->copy()->addMonths($i - 1)->format('Y-m-d'),
                'valor'          => $vBruto,
                'permuta_amount' => $vPermuta,
                'payable_amount' => $vPayable,
                'status'         => 'pendente',
            ]);
        }
    }
}
