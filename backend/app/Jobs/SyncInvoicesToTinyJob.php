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
                if ($invoice->tiny_account_id && $invoice->tiny_account_id !== 'syncing') {
                    $status = $tinyService->getReceivableStatus($invoice->tiny_account_id);
                    if ($status && !isset($status['not_found'])) {
                        Log::info("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} já existe no Tiny ERP com o ID {$invoice->tiny_account_id}. Pulando criação.");
                        
                        // Garante que o status do pagamento seja sincronizado caso já tenha sido paga localmente
                        if ($invoice->status === 'paid') {
                            $tinyService->payReceivable($invoice->tiny_account_id, $valorCobrado, 0);
                        }
                        
                        $invoice->update(['sync_status' => null]);
                        continue;
                    }
                    
                    // Se não foi localizada, limpa localmente para que possa ser recriada
                    Log::warning("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} possui Tiny ID {$invoice->tiny_account_id} inválido/inexistente no Tiny. Limpando e recriando.");
                    $invoice->update([
                        'tiny_account_id' => null,
                        'payment_url'     => null,
                    ]);
                }

                $tinyData = $tinyService->createReceivable($invoice, $valorCobrado);
                
                $invoice->update([
                    'tiny_account_id' => $tinyData['tiny_account_id'],
                    'payment_url'     => $tinyData['payment_url'],
                    'sync_status'     => null,
                ]);

                Log::info("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} enviada ao Tiny com sucesso. ID: {$tinyData['tiny_account_id']}");

                // Se a fatura já estiver paga localmente, dar baixa imediatamente no Tiny
                if ($invoice->status === 'paid') {
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
