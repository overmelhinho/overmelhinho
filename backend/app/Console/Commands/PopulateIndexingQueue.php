<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Services\SlugService;
use Illuminate\Support\Facades\DB;

class PopulateIndexingQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seo:populate-indexing-queue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Varre o banco e carrega todas as URLs de SEO ativas e válidas para a fila de indexação.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $siteUrl = config('app.frontend_url', 'https://www.overmelhinho.com.br');
        if (str_contains($siteUrl, 'localhost') || str_contains($siteUrl, 'dash.')) {
            $siteUrl = 'https://www.overmelhinho.com.br'; // Força a URL pública de produção para a fila
        }
        
        $this->info("🔍 Buscando e processando clientes ativos em blocos (priorizando pagantes e URL canônica)...");
        
        $clientCanonicalUrls = [];
        $categoryUrls = [];
        
        Cliente::where('exibir_no_site', 'true')
            ->orderByRaw("CASE WHEN tipo_cliente = 'pagante' AND status_assinatura IN ('ativa', 'ativo', 'inadimplente') THEN 1 ELSE 0 END DESC")
            ->orderBy('id', 'asc')
            ->with(['enderecos', 'segmentos', 'cidadesAtendidas'])
            ->chunk(150, function ($clientes) use (&$clientCanonicalUrls, &$categoryUrls, $siteUrl) {
                foreach ($clientes as $cliente) {
                    $address = $cliente->enderecos->first();
                    if (!$address || empty($address->cidade)) {
                        continue;
                    }
                    
                    $citySlug = SlugService::create($address->cidade);
                    if (!$citySlug) {
                        continue;
                    }
                    
                    $clientSlug = $cliente->slug ?: $cliente->id;
                    $primarySegment = $cliente->segmentos->firstWhere('pivot.is_primary', true) ?: $cliente->segmentos->first();
                    
                    if ($primarySegment) {
                        $primarySegmentSlug = $primarySegment->slug ? SlugService::create($primarySegment->slug) : SlugService::create($primarySegment->nome);
                        if ($primarySegmentSlug) {
                            // URL Canônica Principal do Cliente (apenas 1 por cidade para não canibalizar SEO)
                            $canonicalClientUrl = "{$siteUrl}/{$citySlug}/{$primarySegmentSlug}/{$clientSlug}";
                            $clientCanonicalUrls[$canonicalClientUrl] = true;
                        }
                    }
                    
                    foreach ($cliente->segmentos as $segmento) {
                        $segmentSlug = $segmento->slug ? SlugService::create($segmento->slug) : SlugService::create($segmento->nome);
                        if (!$segmentSlug) {
                            continue;
                        }
                        
                        // URL da Categoria na Cidade
                        $categoryUrl = "{$siteUrl}/{$citySlug}/{$segmentSlug}";
                        $categoryUrls[$categoryUrl] = true;
                    }
                }
            });
        
        // Clientes (especialmente pagantes) entram primeiro, seguidos pelas páginas de categorias
        $urlsList = array_values(array_unique(array_merge(array_keys($clientCanonicalUrls), array_keys($categoryUrls))));
        $totalUrls = count($urlsList);
        $this->info("📈 Geradas {$totalUrls} URLs canônicas únicas para indexação.");
        
        $inserted = 0;
        foreach (array_chunk($urlsList, 100) as $chunk) {
            $data = array_map(function($url) {
                return [
                    'url' => $url,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }, $chunk);
            
            $inserted += DB::table('seo_indexing_queue')
                ->insertOrIgnore($data);
        }
        
        $this->info("✅ Sucesso! {$inserted} novas URLs inseridas na fila.");
        return 0;
    }
}
