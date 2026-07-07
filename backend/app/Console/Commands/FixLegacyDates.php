<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Autorizacao;
use Carbon\Carbon;

class FixLegacyDates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'legacy:fix-dates {--dry-run : Apenas simula, sem salvar no banco}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza as datas (data_cadastro e data_inicial) do legado com (created_at e data_inicio) do sistema novo.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        $this->info("====================================");
        $this->info(" SINCRONIZANDO DATAS DAS AUTORIZAÇÕES");
        if ($isDryRun) {
            $this->warn(" MODO DRY-RUN: Nenhuma alteração será salva.");
        }
        $this->info("====================================");

        $totalAutorizacoes = Autorizacao::whereNotNull('numero')->count();
        $this->info("Verificando {$totalAutorizacoes} autorizações em lotes...");

        $fixedCount = 0;
        $mismatchCount = 0;

        $bar = $this->output->createProgressBar($totalAutorizacoes);

        Autorizacao::whereNotNull('numero')->chunk(500, function ($autorizacoes) use (&$fixedCount, &$mismatchCount, $bar, $isDryRun) {
            $numeros = $autorizacoes->pluck('numero')->unique()->toArray();
            
            $legacyData = collect();
            $records = DB::connection('legacy')->table('publicidades')
                ->whereIn('num_autorizacao', $numeros)
                ->get(['num_autorizacao', 'data_cadastro', 'data_inicial', 'data_final']);
            
            foreach ($records as $r) {
                $legacyData->put($r->num_autorizacao, $r);
            }

            foreach ($autorizacoes as $auth) {
                $legacy = $legacyData->get($auth->numero);
                if (!$legacy) {
                    $bar->advance();
                    continue;
                }

                $legacyDataCadastro = $legacy->data_cadastro; 
                $legacyDataInicial = $legacy->data_inicial;
                
                if (!$legacyDataCadastro || $legacyDataCadastro === '0000-00-00') {
                    $bar->advance();
                    continue;
                }
                if (!$legacyDataInicial || $legacyDataInicial === '0000-00-00') {
                    $bar->advance();
                    continue;
                }

                $newCreatedAt = $auth->created_at ? $auth->created_at->format('Y-m-d') : null;
                $newDataInicio = $auth->data_inicio ? Carbon::parse($auth->data_inicio)->format('Y-m-d') : null;

                $needsFix = false;

                if ($newCreatedAt !== $legacyDataCadastro) {
                    $needsFix = true;
                }
                if ($newDataInicio !== $legacyDataInicial) {
                    $needsFix = true;
                }

                if ($needsFix) {
                    $mismatchCount++;
                    
                    if (!$isDryRun) {
                        $auth->created_at = Carbon::parse($legacyDataCadastro);
                        $auth->data_inicio = Carbon::parse($legacyDataInicial);

                        if ($legacy->data_final && $legacy->data_final !== '0000-00-00') {
                            $auth->data_fim = Carbon::parse($legacy->data_final);
                        }
                        
                        $auth->saveQuietly();
                        $fixedCount++;
                    }
                }
                
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->info("Total de divergências encontradas: $mismatchCount");
        if (!$isDryRun) {
            $this->info("Total de autorizações corrigidas: $fixedCount");
        }
        
        return Command::SUCCESS;
    }
}
