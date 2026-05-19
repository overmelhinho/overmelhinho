<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use Illuminate\Support\Facades\DB;

class RecoverCitiesFromLegacy extends Command
{
    protected $signature = 'data:recover-cities';
    protected $description = 'Recupera as cidades atendidas baseadas nos registros duplicados do banco de dados legado.';

    public function handle()
    {
        $this->info('Iniciando recuperação de cidades das filiais/duplicatas deletadas (CORREÇÃO)...');

        // Carregar mapeamento correto
        $this->info('Lendo endereços e endereços_bairros...');
        $enderecosBairrosMap = DB::connection('legacy')->table('enderecos_bairros')->get()->keyBy('id');
        $enderecosMap = DB::connection('legacy')->table('enderecos')->get()->keyBy('id');

        // 1. Pegar todos os nomes que tinham duplicatas no banco legado
        $duplicates = DB::connection('legacy')->table('clientes')
            ->select('pj_nome_fantasia')
            ->whereNotNull('pj_nome_fantasia')
            ->where('pj_nome_fantasia', '!=', '')
            ->groupBy('pj_nome_fantasia')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        $this->info("Encontrados {$duplicates->count()} nomes com filiais no banco legado.");
        $bar = $this->output->createProgressBar($duplicates->count());

        $cidadesCorrigidas = 0;

        foreach ($duplicates as $dup) {
            // Achar a matriz no banco atual
            $matriz = Cliente::where('nome_fantasia', $dup->pj_nome_fantasia)->orderBy('id', 'asc')->first();

            if (!$matriz) {
                $bar->advance();
                continue;
            }

            // Buscar todas as filiais no banco legado
            $legacyFiliais = DB::connection('legacy')->table('clientes')
                ->where('pj_nome_fantasia', $dup->pj_nome_fantasia)
                ->get();

            $cidadesToAttach = [];

            foreach ($legacyFiliais as $lf) {
                if ($lf->id_endereco) {
                    $leb = $enderecosBairrosMap[$lf->id_endereco] ?? null;
                    if ($leb) {
                        $legacyEnd = $enderecosMap[$leb->id_endereco] ?? null;
                        if ($legacyEnd && $legacyEnd->id_cidade) {
                            $cidadesToAttach[] = $legacyEnd->id_cidade;
                        }
                    }
                }
            }

            if (!empty($cidadesToAttach)) {
                $cidadesToAttach = array_unique($cidadesToAttach);
                $matriz->cidadesAtendidas()->sync($cidadesToAttach);
                $cidadesCorrigidas += count($cidadesToAttach);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Recuperação concluída! $cidadesCorrigidas conexões de cidades foram reestabelecidas.");
    }
}
