<?php

namespace App\Services;

use Google\Client;
use Google\Service\Indexing;
use Illuminate\Support\Facades\Log;

class GoogleIndexingService
{
    protected $indexing;

    public function __construct()
    {
        $client = new Client();
        
        $keyPath = config('services.google.indexing_key_path');

        if ($keyPath && file_exists($keyPath)) {
            $client->setAuthConfig($keyPath);
            $client->addScope('https://www.googleapis.com/auth/indexing');
            $this->indexing = new Indexing($client);
        } else {
            Log::warning("Google Indexing API: Arquivo de credenciais não encontrado em $keyPath");
        }
    }

    /**
     * Notifica o Google sobre uma URL nova ou atualizada.
     * 
     * @param string $url
     * @return bool
     */
    public function updateUrl(string $url): bool
    {
        if (!$this->indexing) {
            return false;
        }

        $urlNotification = new Indexing\UrlNotification();
        $urlNotification->setUrl($url);
        $urlNotification->setType('URL_UPDATED');

        try {
            $this->indexing->urlNotifications->publish($urlNotification);
            Log::info("Google Indexing API: URL enviada com sucesso -> $url");
            return true;
        } catch (\Exception $e) {
            Log::error("Google Indexing API: Erro ao indexar URL $url -> " . $e->getMessage());
            return false;
        }
    }

    /**
     * Notifica o Google sobre uma URL que foi removida.
     * 
     * @param string $url
     * @return bool
     */
    public function deleteUrl(string $url): bool
    {
        if (!$this->indexing) {
            return false;
        }

        $urlNotification = new Indexing\UrlNotification();
        $urlNotification->setUrl($url);
        $urlNotification->setType('URL_DELETED');

        try {
            $this->indexing->urlNotifications->publish($urlNotification);
            Log::info("Google Indexing API: URL removida informada com sucesso -> $url");
            return true;
        } catch (\Exception $e) {
            Log::error("Google Indexing API: Erro ao informar remoção de URL $url -> " . $e->getMessage());
            return false;
        }
    }
}
