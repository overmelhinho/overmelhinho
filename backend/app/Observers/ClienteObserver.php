<?php

namespace App\Observers;

use App\Models\Cliente;
use App\Services\GoogleIndexingService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClienteObserver
{
    /**
     * Garante que os eventos do Observer só sejam disparados APÓS a transação de banco (DB::commit()) ser confirmada.
     * Em caso de rollback da transação, nenhum webhook ou invalidação prematura de cache é disparada.
     */
    public bool $afterCommit = true;

    protected $indexingService;

    public function __construct(GoogleIndexingService $indexingService)
    {
        $this->indexingService = $indexingService;
    }

    public function created(Cliente $cliente): void
    {
        // Despacha o Job para enriquecimento de dados se tiver CNPJ
        if (!empty($cliente->cnpj)) {
            \App\Jobs\DispatchEnrichmentJob::dispatch($cliente);
        }
    }

    public function saved(Cliente $cliente): void
    {
        // 🚀 Dispara a Revalidação de Cache no Next.js (On-Demand ISR)
        \Illuminate\Support\Facades\Cache::forget('sitemap_combinations');
        \Illuminate\Support\Facades\Cache::forget('sitemap_data_clientes');
        $this->triggerNextJsRevalidation($cliente);
        $siteUrl = config('app.frontend_url', 'https://www.overmelhinho.com.br');
        
        // Pula indexação para testes E2E, robots ou se rodando localmente
        if (str_contains($siteUrl, 'localhost') || 
            str_contains(strtolower($cliente->nome_fantasia), 'e2e') || 
            str_contains(strtolower($cliente->nome_fantasia), 'robot')) {
            return;
        }

        // Só indexa se o cliente estiver marcado para exibir no site
        if ($cliente->exibir_no_site) {
            $slug = $cliente->slug ?: $cliente->id;
            $url = "{$siteUrl}/cliente/{$slug}";
            
            $this->indexingService->updateUrl($url);
        }
    }

    /**
     * Handle the Cliente "deleted" event.
     */
    public function deleted(Cliente $cliente): void
    {
        // 🚀 Dispara a Revalidação de Cache no Next.js (On-Demand ISR)
        \Illuminate\Support\Facades\Cache::forget('sitemap_combinations');
        \Illuminate\Support\Facades\Cache::forget('sitemap_data_clientes');
        $this->triggerNextJsRevalidation($cliente);
        $siteUrl = config('app.frontend_url', 'https://www.overmelhinho.com.br');
        
        // Pula indexação para testes E2E, robots ou se rodando localmente
        if (str_contains($siteUrl, 'localhost') || 
            str_contains(strtolower($cliente->nome_fantasia), 'e2e') || 
            str_contains(strtolower($cliente->nome_fantasia), 'robot')) {
            return;
        }

        $slug = $cliente->slug ?: $cliente->id;
        $url = "{$siteUrl}/cliente/{$slug}";
        
        $this->indexingService->deleteUrl($url);
    }

    /**
     * Dispara um Webhook para o Next.js purgar o cache ISR deste cliente específico.
     */
    protected function triggerNextJsRevalidation(Cliente $cliente): void
    {
        $siteUrl = config('services.revalidate.url') ?: env('SITE_URL', 'https://www.overmelhinho.com.br');
        $secret = config('services.revalidate.secret') ?: env('REVALIDATE_SECRET');
        
        // Pula se o segredo não estiver configurado (fail-secure: sem segredo padrão hardcoded)
        if (empty($secret)) {
            Log::warning("Revalidação Next.js abortada: REVALIDATE_SECRET não configurado.");
            return;
        }

        // Pula se for robô ou teste E2E
        if (str_contains(strtolower($cliente->nome_fantasia), 'e2e') || 
            str_contains(strtolower($cliente->nome_fantasia), 'robot')) {
            return;
        }

        try {
            $tags = [
                "client-{$cliente->id}",
                "category-search",
                "sitemap-combinations",
                "sitemap-companies",
            ];

            if ($cliente->slug) {
                $tags[] = "client-{$cliente->slug}";
            }

            // Revalida cidades e segmentos específicos do cliente para atualizar listagens cidade/categoria
            $cityIds = $cliente->cidadesAtendidas()->pluck('cidades.id')->toArray();
            if ($cliente->enderecos()->exists()) {
                $cityNames = $cliente->enderecos()->pluck('cidade')->filter()->toArray();
                if (!empty($cityNames)) {
                    $addrCityIds = \App\Models\Cidade::whereIn('nome', $cityNames)->pluck('id')->toArray();
                    $cityIds = array_unique(array_merge($cityIds, $addrCityIds));
                }
            }

            $segmentIds = $cliente->segmentos()->pluck('segmentos.id')->toArray();

            foreach ($cityIds as $cid) {
                $tags[] = "city-{$cid}";
                foreach ($segmentIds as $sid) {
                    $tags[] = "search-{$cid}-{$sid}";
                }
            }

            // Invalidação atômica e versionada do cache local (retrocompatível em caso de revert do Commit 2B)
            if (method_exists(\App\Http\Controllers\Api\V1\ClienteController::class, 'bumpSitemapInvalidation')) {
                \App\Http\Controllers\Api\V1\ClienteController::bumpSitemapInvalidation();
            } else {
                \Illuminate\Support\Facades\Cache::forget('sitemap_data_clientes');
            }

            // Transmissão segura via Cabeçalho HTTP (sem segredo na URL)
            $webhookUrl = rtrim($siteUrl, '/') . '/webhook/revalidate';
            Http::withHeaders([
                'x-revalidate-token' => $secret,
                'Accept' => 'application/json',
            ])->timeout(5)->post($webhookUrl, [
                'tags' => array_values(array_unique($tags))
            ]);
        } catch (\Exception $e) {
            Log::error("Falha ao revalidar cache Next.js para o cliente {$cliente->id}: " . $e->getMessage());
        }
    }
}
