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
        if (str_contains($siteUrl, 'localhost')) {
            $siteUrl = 'https://www.overmelhinho.com.br'; // Força a URL de produção para a fila
        }
        
        $this->info("🔍 Buscando e processando clientes ativos em blocos...");
        
        $urls = [];
        
        Cliente::where('exibir_no_site', 'true')
            ->with(['enderecos', 'segmentos'])
            ->chunk(150, function ($clientes) use (&$urls, $siteUrl) {
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
                    
                    foreach ($cliente->segmentos as $segmento) {
                        $segmentSlug = $segmento->slug ?: SlugService::create($segmento->nome);
                        if (!$segmentSlug) {
                            continue;
                        }
                        
                        // 1. URL da Categoria na Cidade
                        $categoryUrl = "{$siteUrl}/{$citySlug}/{$segmentSlug}";
                        $urls[$categoryUrl] = true;
                        
                        // 2. URL de Perfil do Cliente
                        $clientUrl = "{$siteUrl}/{$citySlug}/{$segmentSlug}/{$clientSlug}";
                        $urls[$clientUrl] = true;
                    }
                }
            });
        
        $urlsList = array_keys($urls);
        $totalUrls = count($urlsList);
        $this->info("📈 Geradas {$totalUrls} URLs únicas para indexação.");
        
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
