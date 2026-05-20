<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixPrimarySegments extends Command
{
    protected $signature = 'migrate:fix-primary-segments';
    protected $description = 'Corrige o segmento principal lendo a ordem de insercao da base legada (clientes_categorias)';

    public function handle()
    {
        $this->info('Iniciando correção de segmentos principais...');

        // Primeiro, limpamos todas as flags is_primary
        DB::statement('UPDATE cliente_segmento SET is_primary = false');
        $this->info('Flags is_primary resetadas.');

        $processed = 0;
        $fixed = 0;

        // Pegar a categoria "principal" (aquela com o menor ID na tabela relacional legada) para cada cliente
        DB::connection('legacy')->table('clientes_categorias')
            ->select('id_cliente', DB::raw('MIN(id) as min_id'))
            ->groupBy('id_cliente')
            ->orderBy('id_cliente')
            ->chunk(1000, function ($minCategorias) use (&$processed, &$fixed) {
                
                $minIds = $minCategorias->pluck('min_id')->toArray();
                
                // Agora pegamos o id_categoria correspondente a esses min_ids
                $legacyPrimary = DB::connection('legacy')->table('clientes_categorias')
                    ->whereIn('id', $minIds)
                    ->pluck('id_categoria', 'id_cliente')
                    ->toArray();
                
                foreach ($legacyPrimary as $idCliente => $idCategoria) {
                    $processed++;
                    
                    // Tenta encontrar a relação na nova base e atualizar para true
                    $updated = DB::table('cliente_segmento')
                        ->where('cliente_id', $idCliente)
                        ->where('segmento_id', $idCategoria)
                        ->update(['is_primary' => DB::raw('true')]);

                    if ($updated) {
                        $fixed++;
                    } else {
                        // Fallback de segurança se nao achar
                        $firstSegment = DB::table('cliente_segmento')
                            ->where('cliente_id', $idCliente)
                            ->first();
                            
                        if ($firstSegment) {
                            DB::table('cliente_segmento')
                                ->where('cliente_id', $idCliente)
                                ->where('segmento_id', $firstSegment->segmento_id)
                                ->update(['is_primary' => DB::raw('true')]);
                        }
                    }
                }
                $this->info("Processados: $processed | Corrigidos (1º inserido do legado): $fixed");
            });

        $this->info('Correção finalizada!');
    }
}
