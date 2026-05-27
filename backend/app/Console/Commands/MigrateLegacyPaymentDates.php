<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateLegacyPaymentDates extends Command
{
    protected $signature = 'legacy:sync-payment-dates';
    protected $description = 'Sincroniza as datas exatas de pagamento do legado para as faturas locais';

    public function handle()
    {
        $this->info("Buscando pagamentos no sistema legado...");

        try {
            // Pegar os pagamentos e suas datas no legado
            $pagamentos = DB::connection('legacy')->table('publicidades_parcelas_pagamentos')
                ->get();
                
            $this->info("Encontrados " . count($pagamentos) . " registros de pagamento no legado.");
            
            // Qual a coluna de data?
            $dateColumn = null;
            if (count($pagamentos) > 0) {
                $first = (array) $pagamentos[0];
                if (array_key_exists('data', $first)) $dateColumn = 'data';
                else if (array_key_exists('data_pagamento', $first)) $dateColumn = 'data_pagamento';
                else if (array_key_exists('criado_em', $first)) $dateColumn = 'criado_em';
                else if (array_key_exists('created_at', $first)) $dateColumn = 'created_at';
            }

            if (!$dateColumn) {
                $this->error("Não consegui identificar a coluna de data na tabela do legado.");
                if (count($pagamentos) > 0) {
                    $this->line("Colunas disponíveis: " . implode(', ', array_keys((array)$pagamentos[0])));
                }
                return;
            }

            $this->info("Coluna de data identificada: {$dateColumn}");

            $updatedCount = 0;
            $bar = $this->output->createProgressBar(count($pagamentos));

            foreach ($pagamentos as $pag) {
                $pagArr = (array) $pag;
                $dataPagamento = $pagArr[$dateColumn];

                if (!$dataPagamento) {
                    $bar->advance();
                    continue;
                }

                // Achar a parcela local correspondente (invoice)
                // A parcela legada foi migrada para autorizacao_parcelas, e as autorizacao_parcelas viraram invoices.
                // Mas pera, os ids do legado bateram com os ids locais?
                // O SyncRecentLegacyPayments faz: DB::table('autorizacao_parcelas')->where('id', $pag->id_parcela)
                // Então o ID da autorizacao_parcela = id_parcela do legado
                
                $parcelaLocal = DB::table('autorizacao_parcelas')
                    ->where('id', $pagArr['id_parcela'])
                    ->first();

                if ($parcelaLocal && $parcelaLocal->invoice_id) {
                    // Tem uma invoice vinculada!
                    // Só atualiza se a data for válida (ano > 2000) e não estiver preenchida ou a gente quiser forçar.
                    // Para o caso do usuário: "neste mês de maio as faturas que foram pagas"
                    
                    DB::table('invoices')
                        ->where('id', $parcelaLocal->invoice_id)
                        // ->whereNull('action_date') // Opcional, mas vamos sobreescrever para garantir
                        ->update([
                            'action_date' => $dataPagamento
                        ]);

                    $updatedCount++;
                }

                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("✅ Foram atualizadas as datas exatas de pagamento de {$updatedCount} faturas locais!");

        } catch (\Exception $e) {
            $this->error("Erro ao sincronizar: " . $e->getMessage());
        }
    }
}
