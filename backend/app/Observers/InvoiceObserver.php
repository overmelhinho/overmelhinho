<?php

namespace App\Observers;

use App\Models\Invoice;
use App\Models\Autorizacao;
use Illuminate\Support\Facades\Log;

class InvoiceObserver
{
    /**
     * Handle the Invoice "saved" event.
     */
    public function saved(Invoice $invoice): void
    {
        $this->syncAutorizacao($invoice);
    }

    /**
     * Handle the Invoice "deleted" event.
     */
    public function deleted(Invoice $invoice): void
    {
        $this->syncAutorizacao($invoice);
    }

    /**
     * Sincroniza as parcelas do contrato (AutorizacaoParcela) com a fatura (Invoice) e regenera o PDF.
     */
    protected function syncAutorizacao(Invoice $invoice): void
    {
        // Verifica se a fatura pertence a uma autorização
        if ($invoice->group_id && str_starts_with($invoice->group_id, 'autorizacao-')) {
            $autorizacaoId = str_replace('autorizacao-', '', $invoice->group_id);
            
            try {
                if (function_exists('defer')) {
                    defer(fn () => Autorizacao::syncParcelasWithInvoices((int) $autorizacaoId));
                } else {
                    Autorizacao::syncParcelasWithInvoices((int) $autorizacaoId);
                }
            } catch (\Exception $e) {
                Log::error('Erro ao sincronizar parcelas da autorização: ' . $e->getMessage());
            }
        }
    }
}
