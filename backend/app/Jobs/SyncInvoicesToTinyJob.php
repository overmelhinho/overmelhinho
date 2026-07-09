<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
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

    public function __construct(array $invoiceIds)
    {
        $this->invoiceIds = $invoiceIds;
    }

    public function handle(TinyErpService $tinyService)
    {
        $invoices = Invoice::whereIn('id', $this->invoiceIds)
            ->with(['client.enderecos', 'client.contatos', 'plan'])
            ->get();

        Log::info("[SyncInvoicesToTinyJob] Iniciando sincronização em background para {$invoices->count()} faturas.");

        // Agrupa por group_id
        $groupedInvoices = $invoices->groupBy('group_id');

        foreach ($groupedInvoices as $groupId => $group) {
            try {
                // Remove faturas de permuta (valor 0)
                $validInvoices = $group->filter(function($inv) {
                    $val = $inv->payable_amount ?? $inv->amount;
                    if ($val <= 0) {
                        $inv->update(['sync_status' => null]);
                        return false;
                    }
                    return true;
                });

                if ($validInvoices->isEmpty()) {
                    continue;
                }

                // Verifica se já existe sync (usa a primeira fatura como referência)
                $firstInvoice = $validInvoices->first();
                if (($firstInvoice->tiny_account_id || $firstInvoice->tiny_order_id) && $firstInvoice->tiny_account_id !== 'syncing') {
                    $status = null;
                    if ($firstInvoice->tiny_account_id) {
                        $status = $tinyService->getReceivableStatus($firstInvoice->tiny_account_id);
                    }
                    if ($status && !isset($status['not_found'])) {
                        Log::info("[SyncInvoicesToTinyJob] Grupo {$groupId} já existe no Tiny ERP. Pulando criação.");
                        foreach ($validInvoices as $inv) {
                            $inv->update(['sync_status' => null]);
                        }
                        continue;
                    }
                    
                    if ($firstInvoice->tiny_account_id) {
                        Log::warning("[SyncInvoicesToTinyJob] Grupo {$groupId} possui Tiny ID inválido. Limpando e recriando.");
                        foreach ($validInvoices as $inv) {
                            $inv->update([
                                'tiny_order_id'   => null,
                                'tiny_account_id' => null,
                                'payment_url'     => null,
                            ]);
                        }
                    }
                }

                // Cria o pedido consolidado apenas se não tiver
                $tinyData = ['tiny_order_id' => $firstInvoice->tiny_order_id, 'payment_url' => null];
                if (!$tinyData['tiny_order_id']) {
                    $tinyData = $tinyService->createServiceOrderGroup($validInvoices);
                }
                
                foreach ($validInvoices as $invoice) {
                    // Força a criação do Contas a Receber
                    $tinyAccountId = $tinyService->createReceivableAccount($invoice);

                    $invoice->update([
                        'tiny_order_id'   => $tinyData['tiny_order_id'] ?? null,
                        'tiny_account_id' => $tinyAccountId,
                        'payment_url'     => $tinyData['payment_url'] ?? null,
                        'sync_status'     => null,
                    ]);
                    
                    Log::info("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} (Grupo {$groupId}) vinculada ao Order ID: " . ($tinyData['tiny_order_id'] ?? 'null') . " e Account ID: {$tinyAccountId}");

                    // Se a fatura já estiver paga localmente, o ideal seria dar baixa na conta a receber
                    if ($invoice->status === 'paid' && $tinyAccountId) {
                        $valorCobrado = $invoice->payable_amount ?? $invoice->amount;
                        $tinyService->payReceivable($tinyAccountId, $valorCobrado, 0);
                        Log::info("[SyncInvoicesToTinyJob] Fatura #{$invoice->id} já estava paga. Baixa retroativa realizada no Tiny com sucesso.");
                    }
                }

            } catch (\Exception $e) {
                Log::error("[SyncInvoicesToTinyJob] Falha ao enviar grupo {$groupId}: " . $e->getMessage());
                foreach ($group as $invoice) {
                    try {
                        $invoice->update(['sync_status' => 'error']);
                    } catch (\Exception $e2) {
                        Log::error("[SyncInvoicesToTinyJob] Falha ao atualizar status de erro da fatura #{$invoice->id}: " . $e2->getMessage());
                    }
                }
            }
        }
    }
}
