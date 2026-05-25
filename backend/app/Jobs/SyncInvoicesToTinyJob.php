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
            ->whereNull('tiny_account_id')
            ->with(['client.enderecos', 'client.contatos', 'plan'])
            ->get();

        Log::info("[SyncInvoicesToTinyJob] Iniciando sincronização em background para {$invoices->count()} faturas.");

        foreach ($invoices as $invoice) {
            try {
                $valorCobrado = $invoice->payable_amount ?? $invoice->amount;

                // Pula faturas de permuta total (valor 0)
                if ($valorCobrado <= 0) {
                    continue;
                }

                $tinyData = $tinyService->createReceivable($invoice, $valorCobrado);
                
                $invoice->update([
                    'tiny_account_id' => $tinyData['tiny_account_id'],
                    'payment_url'     => $tinyData['payment_url'],
                ]);

                Log::info("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} enviada ao Tiny com sucesso. ID: {$tinyData['tiny_account_id']}");

            } catch (\Exception $e) {
                Log::error("[SyncInvoicesToTinyJob] Falha ao enviar fatura #{$invoice->id}: " . $e->getMessage());
            }

            // Aguarda 1 segundo entre as requisições para evitar o erro "API Bloqueada" (Rate Limit do Tiny ERP)
            sleep(1);
        }

        Log::info("[SyncInvoicesToTinyJob] Sincronização finalizada.");
    }
}
