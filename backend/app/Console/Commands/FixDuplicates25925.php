<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;

class FixDuplicates25925 extends Command
{
    protected $signature = 'app:fix-duplicates-25925';
    protected $description = 'Deleta as faturas duplicadas da autorizacao 25925 que ficaram pendentes no ERP (sem sincronizar).';

    public function handle()
    {
        $this->info("Buscando faturas duplicadas da autorização 25925...");

        // Busca faturas da autorizacao 25925 que NÃO têm ID do Tiny ERP
        $invoices = Invoice::where('group_id', 'autorizacao-25925')
            ->whereNull('tiny_account_id')
            ->get();

        if ($invoices->isEmpty()) {
            $this->warn("Nenhuma fatura duplicada/pendente encontrada para a autorização 25925.");
            return;
        }

        $count = 0;
        foreach ($invoices as $invoice) {
            $this->line("Deletando Fatura ID: {$invoice->id} | Parcela: {$invoice->parcel_number} | Valor: {$invoice->amount}");
            $invoice->delete();
            $count++;
        }

        $this->info("Sucesso! {$count} faturas duplicadas foram excluídas.");
    }
}
