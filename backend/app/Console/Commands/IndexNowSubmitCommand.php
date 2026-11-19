<?php

namespace App\Console\Commands;

use App\Models\Cidade;
use App\Models\Cliente;
use App\Services\IndexNowService;
use Illuminate\Console\Command;

class IndexNowSubmitCommand extends Command
{
    protected $signature = 'indexnow:submit 
                            {url? : URL individual a ser submetida}
                            {--top-cities : Submete a Home, llms.txt, llms-full.txt e os 28 Hubs Municipais}
                            {--client-id= : Submete as URLs canônicas de um cliente específico}';

    protected $description = 'Submete URLs para indexação instantânea via protocolo IndexNow (Bing, Copilot, Perplexity)';

    public function handle(IndexNowService $indexNow): int
    {
        $urls = [];
        $host = config('services.indexnow.host', 'www.overmelhinho.com.br');
        $siteUrl = "https://{$host}";

        if ($singleUrl = $this->argument('url')) {
            $urls[] = $singleUrl;
        }

        if ($this->option('top-cities')) {
            $urls[] = "{$siteUrl}/";
            $urls[] = "{$siteUrl}/llms.txt";
            $urls[] = "{$siteUrl}/llms-full.txt";
            $urls[] = "{$siteUrl}/sitemap.xml";
            $urls[] = "{$siteUrl}/sitemap-categorias.xml";
            $urls[] = "{$siteUrl}/sitemap-empresas.xml";

            // Os 28 municípios oficiais atendidos na Serra Gaúcha
            $topCities = [
                'caxias-do-sul',
                'bento-goncalves',
                'farroupilha',
                'gramado',
                'canela',
                'garibaldi',
                'carlos-barbosa',
                'flores-da-cunha',
                'nova-petropolis',
                'sao-marcos',
                'antonio-prado',
                'veranopolis',
                'nova-prata',
                'guapore',
                'marau',
                'serafina-correa',
                'casca',
                'cotipora',
                'fagundes-varela',
                'montauri',
                'nova-araca',
                'nova-bassano',
                'parai',
                'protasio-alves',
                'sao-jorge',
                'sao-valentim-do-sul',
                'uniao-da-serra',
                'vila-flores',
            ];

            foreach ($topCities as $slug) {
                $urls[] = "{$siteUrl}/{$slug}";
            }
        }

        if ($clientId = $this->option('client-id')) {
            $cliente = Cliente::with(['cidade', 'segmentoPrincipal', 'segmentos'])->find($clientId);
            if ($cliente) {
                $citySlug = $cliente->cidade?->slug ?: ($cliente->cidade?->nome ? \Illuminate\Support\Str::slug($cliente->cidade->nome) : 'caxias-do-sul');
                $clientSlug = $cliente->slug ?: (string) $cliente->id;
                $segSlug = $cliente->segmentoPrincipal?->slug ?: 'empresa';
                $urls[] = "{$siteUrl}/{$citySlug}/{$segSlug}/{$clientSlug}";
            } else {
                $this->error("Cliente ID {$clientId} não encontrado.");
                return 1;
            }
        }

        if (empty($urls)) {
            $this->warn("Nenhuma URL especificada. Use uma URL avulsa, --top-cities ou --client-id=ID.");
            return 1;
        }

        $this->info("Enviando " . count($urls) . " URLs para a API do IndexNow...");
        foreach ($urls as $u) {
            $this->line("  -> {$u}");
        }

        $success = $indexNow->submitUrls($urls);

        if ($success) {
            $this->info("✅ URLs enviadas com sucesso ao IndexNow!");
            return 0;
        } else {
            $this->error("❌ Falha no envio: " . $indexNow->getLastError());
            return 1;
        }
    }
}
