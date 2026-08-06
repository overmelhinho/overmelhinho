<?php

namespace App\Observers;

use App\Models\Cliente;
use App\Services\GoogleIndexingService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClienteObserver
{
    protected $indexingService;

    public function __construct(GoogleIndexingService $indexingService)
    {
        $this->indexingService = $indexingService;
    }

    public function saved(Cliente $cliente): void
    {
        // 🚀 Dispara a Revalidação de Cache no Next.js (On-Demand ISR)
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
        $siteUrl = config('app.frontend_url', 'https://www.overmelhinho.com.br');
        $secret = env('REVALIDATE_SECRET', 'overmelhinho_revalidate_2026');
        
        // Pula se for robô ou teste E2E
        if (str_contains(strtolower($cliente->nome_fantasia), 'e2e') || 
            str_contains(strtolower($cliente->nome_fantasia), 'robot')) {
            return;
        }

        try {
            // Revalida pela Tag do ID
            Http::timeout(3)->post("{$siteUrl}/api/revalidate?secret={$secret}", [
                'tag' => "client-{$cliente->id}"
            ]);
            
            // Revalida pela Tag do Slug
            if ($cliente->slug) {
                Http::timeout(3)->post("{$siteUrl}/api/revalidate?secret={$secret}", [
                    'tag' => "client-{$cliente->slug}"
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Falha ao revalidar cache Next.js para o cliente {$cliente->id}: " . $e->getMessage());
        }
    }
}
