<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IndexNowService
{
    protected string $host;
    protected string $key;
    protected string $keyLocation;
    protected string $endpoint;
    protected ?string $lastError = null;

    public function __construct()
    {
        $this->host = config('services.indexnow.host', 'www.overmelhinho.com.br');
        $this->key = config('services.indexnow.key', 'b38f94d0c11749219c63d59e35a90947');
        $this->keyLocation = config('services.indexnow.key_location', "https://{$this->host}/b38f94d0c11749219c63d59e35a90947.txt");
        $this->endpoint = config('services.indexnow.endpoint', 'https://api.indexnow.org/indexnow');
    }

    public function getLastError(): ?string
    {
        return $this->lastError;
    }

    /**
     * Submete uma única URL para o IndexNow
     */
    public function submitUrl(string $url): bool
    {
        return $this->submitUrls([$url]);
    }

    /**
     * Submete um lote de URLs para o IndexNow (até 10.000 por chamada)
     */
    public function submitUrls(array $urls): bool
    {
        $urls = array_values(array_filter(array_unique($urls)));
        if (empty($urls)) {
            $this->lastError = 'Nenhuma URL fornecida.';
            return false;
        }

        // Garante que todas as URLs pertençam ao host configurado
        $filtered = [];
        foreach ($urls as $url) {
            $parsedHost = parse_url($url, PHP_URL_HOST);
            if ($parsedHost === $this->host || $parsedHost === 'overmelhinho.com.br') {
                $filtered[] = $url;
            }
        }

        if (empty($filtered)) {
            $this->lastError = "Nenhuma URL pertence ao host {$this->host}.";
            return false;
        }

        $payload = [
            'host' => $this->host,
            'key' => $this->key,
            'keyLocation' => $this->keyLocation,
            'urlList' => array_slice($filtered, 0, 10000),
        ];

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Content-Type' => 'application/json; charset=utf-8',
                    'User-Agent' => 'OVermelhinho-IndexNow/1.0',
                ])
                ->post($this->endpoint, $payload);

            if ($response->successful()) { // 200 ou 202
                Log::info("IndexNow: " . count($filtered) . " URLs enviadas com sucesso.", [
                    'status' => $response->status(),
                    'count' => count($filtered)
                ]);
                $this->lastError = null;
                return true;
            }

            $this->lastError = "IndexNow API error ({$response->status()}): " . $response->body();
            Log::warning("IndexNow Submission Failed", [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return false;
        } catch (\Throwable $e) {
            $this->lastError = "IndexNow Exception: " . $e->getMessage();
            Log::error("IndexNow Exception", ['error' => $e->getMessage()]);
            return false;
        }
    }
}
