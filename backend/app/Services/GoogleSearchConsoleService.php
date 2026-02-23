<?php

namespace App\Services;

use Google\Client;
use Google\Service\SearchConsole;
use Google\Service\SearchConsole\SearchAnalyticsQueryRequest;

class GoogleSearchConsoleService
{
    protected $client;
    protected $service;
    protected $siteUrl;

    public function __construct()
    {
        $this->client = new Client();
        
        $keyFilePath = storage_path('app/google/service-account.json');
        $apiKey = env('GOOGLE_SEO_API_KEY');
        
        if (file_exists($keyFilePath)) {
            $this->client->setAuthConfig($keyFilePath);
            $this->client->addScope('https://www.googleapis.com/auth/webmasters.readonly');
            $this->service = new SearchConsole($this->client);
        } elseif ($apiKey) {
            $this->client->setDeveloperKey($apiKey);
            $this->service = new SearchConsole($this->client);
        }

        $this->siteUrl = env('GOOGLE_SEARCH_CONSOLE_SITE_URL', 'https://www.overmelhinho.com.br/');
    }

    /**
     * Busca métricas para uma palavra-chave específica.
     */
    public function getKeywordMetrics(string $keyword, int $days = 14)
    {
        if (!$this->service) {
            return null;
        }

        $request = new SearchAnalyticsQueryRequest();
        $request->setStartDate(now()->subDays($days + 2)->format('Y-m-d'));
        $request->setEndDate(now()->subDays(2)->format('Y-m-d')); // O Google tem delay de ~48h
        $request->setDimensions(['query']);
        
        // Filtro para a palavra-chave exata
        $request->setDimensionFilterGroups([
            [
                'filters' => [
                    [
                        'dimension' => 'query',
                        'operator' => 'equals',
                        'expression' => $keyword
                    ]
                ]
            ]
        ]);

        try {
            $response = $this->service->searchanalytics->query($this->siteUrl, $request);
            $rows = $response->getRows();

            if (empty($rows)) {
                return [
                    'position' => 0,
                    'clicks' => 0,
                    'impressions' => 0,
                    'ctr' => 0
                ];
            }

            $data = $rows[0];
            return [
                'position' => round($data->getPosition(), 1),
                'clicks' => $data->getClicks(),
                'impressions' => $data->getImpressions(),
                'ctr' => round($data->getCtr() * 100, 2)
            ];
        } catch (\Exception $e) {
            \Log::error("Search Console API Error: " . $e->getMessage());
            return null;
        }
    }
}
