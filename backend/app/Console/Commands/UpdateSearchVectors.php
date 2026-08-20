<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class UpdateSearchVectors extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:update-search-vectors';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Atualiza o TSVECTOR de busca para todos os clientes (Backfill)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando sincronização dos vetores de busca via SQL puro...');
        
        $sql = "
        WITH segment_data AS (
            SELECT 
                cs.cliente_id, 
                STRING_AGG(s.nome, ' ') as segment_names
            FROM cliente_segmento cs
            JOIN segmentos s ON cs.segmento_id = s.id
            GROUP BY cs.cliente_id
        )
        UPDATE clientes c
        SET search_vector = to_tsvector(
            'portuguese',
            unaccent(
                COALESCE(c.nome_fantasia, '') || ' ' || 
                COALESCE(c.nome_alternativo, '') || ' ' || 
                COALESCE(c.seo_keywords::text, '') || ' ' || 
                COALESCE(sd.segment_names, '')
            )
        )
        FROM segment_data sd
        WHERE c.id = sd.cliente_id;
        ";

        // Update those without segments
        $sql2 = "
        UPDATE clientes c
        SET search_vector = to_tsvector(
            'portuguese',
            unaccent(
                COALESCE(c.nome_fantasia, '') || ' ' || 
                COALESCE(c.nome_alternativo, '') || ' ' || 
                COALESCE(c.seo_keywords::text, '')
            )
        )
        WHERE search_vector IS NULL;
        ";

        \Illuminate\Support\Facades\DB::statement($sql);
        \Illuminate\Support\Facades\DB::statement($sql2);

        $this->info('Vetores de busca atualizados com sucesso!');
    }
}
