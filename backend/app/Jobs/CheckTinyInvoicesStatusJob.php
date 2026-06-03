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

class CheckTinyInvoicesStatusJob implements ShouldQueue
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
            ->where('status', 'pending')
            ->whereNotNull('tiny_account_id')
            ->with(['client'])
            ->get();

        Log::info("[CheckTinyInvoicesStatusJob] Iniciando verificação de status para {$invoices->count()} faturas no Tiny ERP.");

        foreach ($invoices as $invoice) {
            try {
                $tinyData = $tinyService->getReceivableStatus($invoice->tiny_account_id);

                if ($tinyData) {
                    if (isset($tinyData['not_found']) && $tinyData['not_found'] === true) {
                        Log::warning("[CheckTinyInvoicesStatusJob] Fatura #{$invoice->id} (Tiny ID: {$invoice->tiny_account_id}) não foi localizada no Tiny ERP. Status limpo localmente.");
                        $invoice->update([
                            'tiny_account_id' => null,
                            'payment_url' => null,
                            'sync_status' => null
                        ]);
                        continue;
                    }

                    $situacao = (string)($tinyData['situacao'] ?? '');
                    $isPaid = in_array($situacao, ['2'], true) 
                        || in_array(strtolower($situacao), ['pago', 'recebido'], true);
                    $isCanceled = in_array($situacao, ['3'], true)
                        || in_array(strtolower($situacao), ['cancelado'], true);

                    if ($isPaid) {
                        $invoice->update([
                            'status' => 'paid',
                            'justification' => 'Sincronização automática em background (Tiny ERP)',
                            'action_date' => now(),
                            'sync_status' => null
                        ]);

                        if ($invoice->client) {
                            $invoice->client->update(['status_assinatura' => 'ativo']);
                        }
                        Log::info("[CheckTinyInvoicesStatusJob] Fatura #{$invoice->id} marcada como PAGA.");
                    } elseif ($isCanceled) {
                        $invoice->update([
                            'status' => 'canceled',
                            'justification' => 'Sincronização automática em background (Cancelada no Tiny)',
                            'action_date' => now(),
                            'sync_status' => null
                        ]);
                        Log::info("[CheckTinyInvoicesStatusJob] Fatura #{$invoice->id} marcada como CANCELADA.");
                    } else {
                        // Permanece pendente, mas limpa o sync_status
                        $invoice->update(['sync_status' => null]);
                    }
                } else {
                    Log::warning("[CheckTinyInvoicesStatusJob] Sem resposta do Tiny para fatura #{$invoice->id}");
                    $invoice->update(['sync_status' => null]);
                }
            } catch (\Exception $e) {
                Log::error("[CheckTinyInvoicesStatusJob] Falha ao verificar fatura #{$invoice->id}: " . $e->getMessage());
                try {
                    $invoice->update(['sync_status' => null]);
                } catch (\Exception $updateEx) {
                    Log::error("[CheckTinyInvoicesStatusJob] Erro ao limpar sync_status da fatura #{$invoice->id}: " . $updateEx->getMessage());
                }
            }

            // Pausa de 1 segundo para evitar Rate Limit (429) do Tiny ERP
            sleep(1);
        }

        Log::info("[CheckTinyInvoicesStatusJob] Verificação de status finalizada.");
    }
}
