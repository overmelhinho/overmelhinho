<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Invoice;
use App\Models\Plan;
use App\Services\TinyErpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class FinancialController extends Controller
{
    protected $tinyService;

    public function __construct(TinyErpService $tinyService)
    {
        $this->tinyService = $tinyService;
    }

    /**
     * Exportar Relatório Executivo em PDF
     */
    public function exportReport()
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        // 1. MRR (Faturamento Pago no mês atual)
        $monthlyPaidInvoices = Invoice::where('status', 'paid')
            ->whereBetween('due_date', [$startOfMonth, $endOfMonth])
            ->get();
        $mrr = $monthlyPaidInvoices->sum('amount');
        $paidCount = $monthlyPaidInvoices->count();

        // 2. LTV (Faturamento total pago / clientes únicos pagos)
        $totalPaid = Invoice::where('status', 'paid')->sum('amount');
        $uniqueClientsCount = Invoice::where('status', 'paid')->distinct('client_id')->count('client_id');
        $ltv = $uniqueClientsCount > 0 ? ($totalPaid / $uniqueClientsCount) : 0;

        // 3. Churn Rate (Cancelados nos últimos 30 dias)
        $last30Days = $now->copy()->subDays(30);
        $totalPeriod = Invoice::whereBetween('created_at', [$last30Days, $now])->count();
        $canceledPeriod = Invoice::where('status', 'canceled')
            ->whereBetween('updated_at', [$last30Days, $now])
            ->count();
        $churn = $totalPeriod > 0 ? ($canceledPeriod / $totalPeriod) * 100 : 0;

        // 4. Inadimplência (Pendentes vencidos)
        $overdueList = Invoice::where('status', 'pending')
            ->where('due_date', '<', $now->startOfDay())
            ->with('client')
            ->orderBy('due_date', 'asc')
            ->get();
        $overdueTotal = $overdueList->sum('amount');
        $overdueCount = $overdueList->count();

        // 5. Pendentes (Aguardando futuro)
        $pendingList = Invoice::where('status', 'pending')
            ->where('due_date', '>=', $now->startOfDay())
            ->get();
        $pendingTotal = $pendingList->sum('amount');
        $pendingCount = $pendingList->count();

        // 6. Últimos 15 Recebidos
        $recentPaid = Invoice::where('status', 'paid')
            ->with(['client', 'plan'])
            ->orderBy('updated_at', 'desc')
            ->limit(15)
            ->get();

        $data = [
            'mrr' => $mrr,
            'paidCount' => $paidCount,
            'ltv' => $ltv,
            'churn' => $churn,
            'overdueList' => $overdueList,
            'overdueTotal' => $overdueTotal,
            'overdueCount' => $overdueCount,
            'pendingTotal' => $pendingTotal,
            'pendingCount' => $pendingCount,
            'recentPaid' => $recentPaid,
        ];

        $pdf = Pdf::loadView('reports.financial', $data);

        return $pdf->download('Relatorio_Gestao_PRO_' . $now->format('d-m-Y') . '.pdf');
    }


    /**
     * Listar planos disponíveis
     */
    public function indexPlans()
    {
        return response()->json(Plan::all());
    }

    /**
     * Listar faturas de um cliente
     */
    public function indexClientInvoices($clientId)
    {
        $invoices = Invoice::where('client_id', $clientId)
            ->with('plan')
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json($invoices);
    }

    /**
     * Listar TODAS as faturas (Financeiro Geral)
     */
    public function indexAllInvoices()
    {
        $invoices = Invoice::with(['client.contatos', 'plan'])
            ->orderBy('due_date', 'desc')
            ->limit(100)
            ->get();

        return response()->json($invoices);
    }

    /**
     * Gerar nova cobrança
     */
    public function storeInvoice(Request $request, $clientId)
    {
        $client = Cliente::findOrFail($clientId);

        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'due_date' => 'required|date|after_or_equal:today',
            'amount' => 'nullable|numeric|min:0', // Se nulo, pega do plano
        ]);

        $plan = Plan::find($validated['plan_id']);
        $amount = $validated['amount'] ?? $plan->price;

        $invoice = Invoice::create([
            'client_id' => $client->id,
            'plan_id' => $plan->id,
            'amount' => $amount,
            'due_date' => $validated['due_date'],
            'status' => 'pending',
        ]);

        try {
            // Sincroniza com o Tiny
            $tinyData = $this->tinyService->createReceivable($invoice);

            $invoice->update([
                'tiny_account_id' => $tinyData['tiny_account_id'],
                'payment_url' => $tinyData['payment_url'],
            ]);

            return response()->json([
                'message' => 'Cobrança gerada e enviada ao Tiny ERP com sucesso.',
                'invoice' => $invoice->load('plan'),
            ], 201);

        }
        catch (\Exception $e) {
            return response()->json([
                'message' => 'Fatura criada localmente, mas houve erro ao enviar para o Tiny ERP: ' . $e->getMessage(),
                'invoice' => $invoice->load('plan'),
            ], 201); // Retorna 201 pois o registro local foi feito
        }
    }

    /**
     * Atualizar status da fatura manualmente (Baixa ou Cancelamento)
     */
    public function updateStatus(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:paid,canceled',
            'justification' => 'required|string|min:5',
        ]);

        $invoice->update([
            'status' => $validated['status'],
            'justification' => $validated['justification'],
            'action_date' => now(),
        ]);

        // Se marcou como pago, ativa a assinatura do cliente
        if ($validated['status'] === 'paid') {
            $invoice->client->update(['status_assinatura' => 'ativo']);
        }

        Log::info("Fatura #{$invoice->id} atualizada manualmente para {$validated['status']} por usuário autenticado. Justificativa: {$validated['justification']}");

        return response()->json([
            'message' => 'Fatura atualizada com sucesso.',
            'invoice' => $invoice->load(['client', 'plan']),
        ]);
    }

    /**
     * Sincroniza todas as faturas pendentes com o Tiny ERP
     */
    public function syncInvoices()
    {
        $pendingInvoices = Invoice::where('status', 'pending')
            ->whereNotNull('tiny_account_id')
            ->get();

        $updatedCount = 0;

        foreach ($pendingInvoices as $invoice) {
            $tinyData = $this->tinyService->getReceivableStatus($invoice->tiny_account_id);

            if ($tinyData) {
                $situacao = $tinyData['situacao'] ?? '';
                $isPaid = ($situacao == '2' || strtolower($situacao) == 'pago' || strtolower($situacao) == 'recebido');
                $isCanceled = ($situacao == '3' || strtolower($situacao) == 'cancelado');

                if ($isPaid) {
                    $invoice->update([
                        'status' => 'paid',
                        'justification' => 'Sincronização automática via Tiny ERP (Baixa detectada)',
                        'action_date' => now()
                    ]);

                    if ($invoice->client) {
                        $invoice->client->update(['status_assinatura' => 'ativo']);
                    }
                    $updatedCount++;
                }
                elseif ($situacao === 3) {
                    $invoice->update([
                        'status' => 'canceled',
                        'justification' => 'Sincronização automática via Tiny ERP (Cancelamento detectado)',
                        'action_date' => now()
                    ]);
                    $updatedCount++;
                }
            }
        }

        return response()->json([
            'message' => "Sincronização concluída. {$updatedCount} faturas atualizadas.",
            'updated_count' => $updatedCount
        ]);
    }

    /**
     * Webhook do Tiny ERP (Olist)
     * Recebe notificações de faturamento e baixa de contas.
     */
    public function handleWebhook(Request $request)
    {
        // 1. Logar TUDO para debug - Essencial para entender o que o Tiny está enviando
        Log::info('Tiny Webhook Event Received', [
            'headers' => $request->headers->all(),
            'body' => $request->all(),
            'query' => $request->query->all()
        ]);

        // 2. Extrair dados (O Tiny pode enviar direto no root ou em um array 'contas'/'registros')
        $tinyAccountId = $request->input('id') ?? $request->input('contas.0.id') ?? $request->input('registros.0.id');
        $situacao = $request->input('situacao') ?? $request->input('contas.0.situacao') ?? $request->input('registros.0.situacao');

        if (!$tinyAccountId) {
            Log::warning('Tiny Webhook: ID da conta não identificado no payload.', $request->all());
            return response()->json(['message' => 'ID não identificado'], 400);
        }

        // 3. Buscar a fatura local
        $invoice = Invoice::where('tiny_account_id', (string)$tinyAccountId)->first();

        if (!$invoice) {
            Log::warning("Tiny Webhook: Fatura não encontrada para tiny_account_id: {$tinyAccountId}");
            return response()->json(['message' => 'Fatura local não encontrada'], 404);
        }

        // 4. Verificar se a situação é "Pago/Recebido"
        // No Tiny ERP: 1 = Aberto, 2 = Recebido/Pago, 3 = Cancelado
        $isPaid = ($situacao == 2 || strtolower($situacao) == 'pago' || strtolower($situacao) == 'recebido' || $request->input('status') === 'paid');
        $isCanceled = ($situacao == 3 || strtolower($situacao) == 'cancelado' || $request->input('status') === 'canceled');

        if ($isPaid) {
            $invoice->update([
                'status' => 'paid',
                'justification' => 'Baixa automática via Tiny ERP Webhook',
                'action_date' => now()
            ]);

            // Ativar assinatura do cliente
            if ($invoice->client) {
                $invoice->client->update(['status_assinatura' => 'ativo']);
                Log::info("Cliente #{$invoice->client->id} ativado via Webhook Tiny.");
            }

            Log::info("Fatura #{$invoice->id} marcada como PAGA via Webhook Tiny.");
        }
        elseif ($isCanceled) {
            $invoice->update([
                'status' => 'canceled',
                'justification' => 'Cancelamento via Tiny ERP Webhook',
                'action_date' => now()
            ]);
            Log::info("Fatura #{$invoice->id} marcada como CANCELADA via Webhook Tiny.");
        }

        return response()->json(['status' => 'success', 'processed_id' => $tinyAccountId]);
    }
}
