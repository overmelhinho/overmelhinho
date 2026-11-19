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
        $siteUrl = rtrim(config('services.revalidate.url', 'https://www.overmelhinho.com.br'), '/');

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

            $cidades = Cidade::where('ativo', true)->pluck('slug')->toArray();
            foreach ($cidades as $slug) {
                if ($slug) {
                    $urls[] = "{$siteUrl}/{$slug}";
                }
            }
        }

        if ($clientId = $this->option('client-id')) {
            $cliente = Cliente::with(['cidade', 'segmentoPrincipal', 'segmentos'])->find($clientId);
            if ($cliente) {
                $citySlug = $cliente->cidade?->slug ?: 'caxias-do-sul';
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
