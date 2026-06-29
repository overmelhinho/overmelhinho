<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Invoice;
use App\Services\TinyErpService;
use Illuminate\Support\Facades\Log;

class SyncInvoicesToTinyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $invoiceIds;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(array $invoiceIds)
    {
        $this->invoiceIds = $invoiceIds;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(TinyErpService $tinyService)
    {
        $invoices = Invoice::whereIn('id', $this->invoiceIds)
            ->with(['client.enderecos', 'client.contatos', 'plan'])
            ->get();

        Log::info("[SyncInvoicesToTinyJob] Iniciando sincronização em background para {$invoices->count()} faturas.");

        foreach ($invoices as $invoice) {
            try {
                $valorCobrado = $invoice->payable_amount ?? $invoice->amount;

                // Pula faturas de permuta total (valor 0)
                if ($valorCobrado <= 0) {
                    $invoice->update(['sync_status' => null]);
                    continue;
                }

                // Se a fatura já possui um ID do Tiny, verifica se ele realmente existe
                if (($invoice->tiny_account_id || $invoice->tiny_order_id) && $invoice->tiny_account_id !== 'syncing') {
                    $status = null;
                    if ($invoice->tiny_account_id) {
                        $status = $tinyService->getReceivableStatus($invoice->tiny_account_id);
                    }
                    if ($status && !isset($status['not_found'])) {
                        Log::info("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} já existe no Tiny ERP. Pulando criação.");
                        
                        // Garante que o status do pagamento seja sincronizado caso já tenha sido paga localmente
                        if ($invoice->status === 'paid' && $invoice->tiny_account_id) {
                            $tinyService->payReceivable($invoice->tiny_account_id, $valorCobrado, 0);
                        }
                        
                        $invoice->update(['sync_status' => null]);
                        continue;
                    }
                    
                    // Se não foi localizada, limpa localmente para que possa ser recriada
                    Log::warning("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} possui Tiny ID inválido/inexistente no Tiny. Limpando e recriando.");
                    $invoice->update([
                        'tiny_order_id'   => null,
                        'tiny_account_id' => null,
                        'payment_url'     => null,
                    ]);
                }

                $tinyData = $tinyService->createServiceOrder($invoice, $valorCobrado);
                
                $invoice->update([
                    'tiny_order_id'   => $tinyData['tiny_order_id'] ?? null,
                    'tiny_account_id' => $tinyData['tiny_account_id'] ?? null,
                    'payment_url'     => $tinyData['payment_url'] ?? null,
                    'sync_status'     => null,
                ]);

                Log::info("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} enviada ao Tiny com sucesso. Order ID: " . ($tinyData['tiny_order_id'] ?? 'null') . ", Account ID: " . ($tinyData['tiny_account_id'] ?? 'null'));

                // Se a fatura já estiver paga localmente, dar baixa imediatamente no Tiny
                if ($invoice->status === 'paid' && !empty($tinyData['tiny_account_id'])) {
                    $tinyService->payReceivable($tinyData['tiny_account_id'], $valorCobrado, 0);
                    Log::info("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} já estava paga. Baixa retroativa realizada no Tiny com sucesso.");
                }

            } catch (\Exception $e) {
                Log::error("[SyncInvoicesToTinyJob] Falha ao enviar fatura #{$invoice->id}: " . $e->getMessage());
                try {
                    $invoice->update(['sync_status' => $e->getMessage()]);
                } catch (\Exception $updateEx) {
                    Log::error("[SyncInvoicesToTinyJob] Erro ao salvar erro no sync_status da fatura #{$invoice->id}: " . $updateEx->getMessage());
                }
            }

            // Aguarda 1 segundo entre as requisições para evitar o erro "API Bloqueada" (Rate Limit do Tiny ERP)
            sleep(1);
        }

        Log::info("[SyncInvoicesToTinyJob] Sincronização finalizada.");
    }
}
