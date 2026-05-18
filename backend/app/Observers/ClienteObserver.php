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

    /**
     * Handle the Cliente "saved" event.
     */
    public function saved(Cliente $cliente): void
    {
        // Só indexa se o cliente estiver marcado para exibir no site
        if ($cliente->exibir_no_site) {
            $siteUrl = config('app.frontend_url', 'https://novo.overmelhinho.com.br');
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
        $siteUrl = config('app.frontend_url', 'https://novo.overmelhinho.com.br');
        $slug = $cliente->slug ?: $cliente->id;
        $url = "{$siteUrl}/cliente/{$slug}";
        
        $this->indexingService->deleteUrl($url);
    }
}
