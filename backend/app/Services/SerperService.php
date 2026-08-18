<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SerperService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = env('SERPER_API_KEY');
    }

    /**
     * Fetch the top organic competitors for a given keyword from Serper.dev
     * 
     * @param string $keyword
     * @param int $limit
     * @return array
     */
    public function getTopCompetitors(string $keyword, int $limit = 5): array
    {
        if (!$this->apiKey) {
            Log::warning('SERPER_API_KEY is not configured in .env. Skipping competitor analysis.');
            return [];
        }

        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(20)
            ->post('https://google.serper.dev/search', [
                'q' => $keyword,
                'gl' => 'br', // Brazil
                'hl' => 'pt-br', // Portuguese
                'num' => $limit,
            ]);

            if (!$response->successful()) {
                Log::error('Serper.dev API request failed', [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                return [];
            }

            $data = $response->json();
            
            // Extract the organic results
            $organicResults = $data['organic'] ?? [];
            
            $competitors = [];
            foreach ($organicResults as $result) {
                if (count($competitors) >= $limit) break;
                
                $competitors[] = [
                    'title' => $result['title'] ?? '',
                    'snippet' => $result['snippet'] ?? '',
                    'link' => $result['link'] ?? ''
                ];
            }

            return $competitors;

        } catch (\Throwable $e) {
            Log::error('Exception caught while fetching data from Serper.dev', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
}
