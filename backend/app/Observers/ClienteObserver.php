<?php

namespace App\Observers;

use App\Models\Cliente;
use App\Services\GoogleIndexingService;

class ClienteObserver
{
    protected $indexingService;

    public function __construct(GoogleIndexingService $indexingService)
    {
        $this->indexingService = $indexingService;
    }

    public function saved(Cliente $cliente): void
    {
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
}
