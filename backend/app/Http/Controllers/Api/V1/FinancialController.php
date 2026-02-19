<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Invoice;
use App\Models\Plan;
use App\Services\TinyErpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FinancialController extends Controller
{
    protected $tinyService;

    public function __construct(TinyErpService $tinyService)
    {
        $this->tinyService = $tinyService;
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
     * Webhook do Tiny ERP
     */
    public function handleWebhook(Request $request)
    {
        // Validar token do Tiny se enviado no header ou query
        // Para este exemplo, vamos assumir que o Tiny envia o 'tiny_account_id' e o 'status'

        Log::info('Tiny Webhook Received', $request->all());

        // O formato do webhook do Tiny varia dependendo da configuração.
        // Geralmente envia algo como: { "id": "...", "situacao": "1" }
        // Situacao 1 = Aberto, 2 = Pago, etc (verificar docs do Tiny específicos para cada conta)

        $tinyAccountId = $request->input('id');
        $situacao = $request->input('situacao'); // Exemplo: 2 = Pago

        if (!$tinyAccountId) {
            return response()->json(['message' => 'ID não fornecido'], 400);
        }

        $invoice = Invoice::where('tiny_account_id', $tinyAccountId)->first();

        if (!$invoice) {
            Log::warning('Webhook Tiny: Fatura não encontrada para tiny_account_id: ' . $tinyAccountId);
            return response()->json(['message' => 'Fatura não encontrada'], 404);
        }

        // Se situação for "Pago" (o valor real depende da config do Tiny, simulamos 2)
        if ($situacao == 2 || $request->input('status') === 'paid') {
            $invoice->update(['status' => 'paid']);

            // Mudar status_assinatura do Cliente para 'ativo'
            $invoice->client->update(['status_assinatura' => 'ativo']);

            Log::info("Fatura #{$invoice->id} marcada como paga via Webhook Tiny.");
        }

        return response()->json(['status' => 'success']);
    }
}
