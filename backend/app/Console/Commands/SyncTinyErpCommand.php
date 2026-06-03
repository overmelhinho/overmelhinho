<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;

class SyncTinyErpCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tiny:sync-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispara os Jobs para verificar status e reenviar faturas pendentes ao Tiny ERP';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Iniciando sincronização automática com Tiny ERP...');

        // 1. Faturas que JÁ TEM tiny_account_id e estão pendentes (Checar status)
        $invoiceIdsToCheck = Invoice::where('status', 'pending')
            ->whereNotNull('tiny_account_id')
            ->where(function($q) {
                $q->whereNull('sync_status')
                  ->orWhere('sync_status', '!=', 'syncing');
            })
            ->pluck('id')
            ->toArray();

        if (!empty($invoiceIdsToCheck)) {
            Invoice::whereIn('id', $invoiceIdsToCheck)->update(['sync_status' => 'syncing']);
            $chunks = array_chunk($invoiceIdsToCheck, 25);
            foreach ($chunks as $chunk) {
                \App\Jobs\CheckTinyInvoicesStatusJob::dispatch($chunk);
            }
            $this->info('Job CheckTinyInvoicesStatusJob disparado em lotes de 25 para ' . count($invoiceIdsToCheck) . ' faturas.');
        } else {
            $this->info('Nenhuma fatura pendente com ID do Tiny encontrada para checagem.');
        }

        // 2. Faturas que NÃO TEM tiny_account_id e estão pendentes OU pagas (Reenviar/Sincronizar retroativo)
        $invoiceIdsToSend = Invoice::whereIn('status', ['pending', 'paid'])
            ->whereNull('tiny_account_id')
            ->where(function($q) {
                $q->whereNull('sync_status')
                  ->orWhere('sync_status', '!=', 'syncing');
            })
            ->pluck('id')
            ->toArray();

        if (!empty($invoiceIdsToSend)) {
            Invoice::whereIn('id', $invoiceIdsToSend)->update(['sync_status' => 'syncing']);
            $chunks = array_chunk($invoiceIdsToSend, 25);
            foreach ($chunks as $chunk) {
                \App\Jobs\SyncInvoicesToTinyJob::dispatch($chunk);
            }
            $this->info('Job SyncInvoicesToTinyJob disparado em lotes de 25 para ' . count($invoiceIdsToSend) . ' faturas.');
        } else {
            $this->info('Nenhuma fatura pendente sem ID do Tiny encontrada para reenvio.');
        }

        $this->info('Rotina concluída com sucesso!');
        return 0;
    }
}
