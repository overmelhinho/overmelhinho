<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncRecentLegacyPayments extends Command
{
    protected $signature = 'data:sync-recent-payments';
    protected $description = 'Verifica pagamentos recém feitos no sistema legado e atualiza as faturas no sistema novo.';

    public function handle()
    {
        $this->info("Buscando pagamentos no sistema legado...");

        // 1. Pegar todos os pagamentos da tabela legada
        $pagamentos = DB::connection('legacy')->table('publicidades_parcelas_pagamentos')
            ->pluck('id_parcela')
            ->toArray();
            
        $this->info("Total de pagamentos encontrados no legado: " . count($pagamentos));

        // 2. Procurar parcelas locais que estão pendentes, mas no legado estão pagas
        $parcelasDesatualizadas = DB::table('autorizacao_parcelas')
            ->whereIn('id', $pagamentos)
            ->where('status', '!=', 'pago')
            ->get(['id', 'invoice_id']);

        if ($parcelasDesatualizadas->isEmpty()) {
            $this->info("✅ Nenhuma parcela desatualizada encontrada. O sistema já está 100% sincronizado com os pagamentos.");
            return;
        }

        $this->info("Foram encontradas " . $parcelasDesatualizadas->count() . " parcelas que foram pagas no legado recentemente, mas estão como aguardando aqui.");
        
        $idsParcelas = $parcelasDesatualizadas->pluck('id')->toArray();
        $idsInvoices = $parcelasDesatualizadas->pluck('invoice_id')->filter()->toArray();

        // 3. Atualizar as autorizacao_parcelas
        DB::table('autorizacao_parcelas')
            ->whereIn('id', $idsParcelas)
            ->update(['status' => 'pago', 'updated_at' => now()]);
            
        // 4. Atualizar as invoices
        if (!empty($idsInvoices)) {
            DB::table('invoices')
                ->whereIn('id', $idsInvoices)
                ->update([
                    'status' => 'paid', 
                    'action_date' => now(), 
                    'updated_at' => now(),
                    'justification' => 'Baixa sincronizada automaticamente do sistema legado'
                ]);
        }

        $this->newLine();
        $this->info("✅ " . $parcelasDesatualizadas->count() . " faturas foram marcadas como PAGAS com sucesso!");
        $this->info("As seguintes parcelas (IDs legado) foram atualizadas: " . implode(', ', $idsParcelas));
    }
}
