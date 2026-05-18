<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\AutorizacaoParcela;

class FixLegacyParcelas extends Command
{
    protected $signature = 'data:fix-parcelas';
    protected $description = 'Limpa as parcelas duplicadas geradas pela migração e as importa novamente com os valores corretos.';

    public function handle()
    {
        $this->info("Limpando parcelas antigas...");
        
        // Limpar a tabela
        DB::table('autorizacao_parcelas')->truncate();
        
        $this->info("Importando parcelas originais...");

        $total = DB::connection('legacy')->table('publicidades_parcelas')->count();
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        // Cache de pagamentos para evitar milhares de queries
        $pagamentos = DB::connection('legacy')->table('publicidades_parcelas_pagamentos')->pluck('id_parcela')->toArray();
        $pagamentos = array_flip($pagamentos); // Para busca rápida isset()

        DB::connection('legacy')->table('publicidades_parcelas')->orderBy('id_publicidade')->orderBy('id')->chunk(5000, function ($parcelas) use ($bar, $pagamentos) {
            
            // Verifica se a publicidade respectiva existe no novo banco (para evitar foreign key error)
            $publicidadeIds = $parcelas->pluck('id_publicidade')->unique()->toArray();
            $autorizacoesExistentes = DB::table('autorizacoes')->whereIn('id', $publicidadeIds)->pluck('data_inicio', 'id')->toArray();

            $novasParcelas = [];

            // Agrupa por publicidade para descobrir o "número" da parcela
            $agrupado = $parcelas->groupBy('id_publicidade');

            foreach ($agrupado as $idPublicidade => $parcelasDaPub) {
                if (!isset($autorizacoesExistentes[$idPublicidade])) {
                    $bar->advance($parcelasDaPub->count());
                    continue;
                }

                $numero = 1;
                foreach ($parcelasDaPub as $lpar) {
                    $isPago = isset($pagamentos[$lpar->id]);
                    $valor = is_numeric($lpar->valor) ? $lpar->valor : 0;
                    $vencimento = $this->sanitizeDate($lpar->data_vencimento) ?: $this->sanitizeDate($autorizacoesExistentes[$idPublicidade]) ?: '2000-01-01';

                    $novasParcelas[] = [
                        'id' => $lpar->id,
                        'autorizacao_id' => $idPublicidade,
                        'numero' => $numero,
                        'vencimento' => $vencimento,
                        'valor' => $valor,
                        'payable_amount' => $valor,
                        'status' => $isPago ? 'pago' : 'pendente',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $numero++;
                    $bar->advance();
                }
            }

            if (!empty($novasParcelas)) {
                DB::table('autorizacao_parcelas')->insert($novasParcelas);
            }
        });

        // Corrigir a sequence do postgresql para o ID, caso a gente crie parcelas no futuro
        $maxId = DB::table('autorizacao_parcelas')->max('id') ?? 1;
        DB::statement("SELECT setval('autorizacao_parcelas_id_seq', $maxId)");

        $bar->finish();
        
        $this->newLine(2);
        $this->info("✅ Todas as parcelas foram corrigidas e re-importadas com sucesso!");
    }

    private function sanitizeDate($date)
    {
        if (!$date || str_starts_with($date, '0000') || str_starts_with($date, '-') || str_contains($date, '00-00') || str_starts_with($date, '9999')) {
            return null;
        }
        return $date;
    }
}
