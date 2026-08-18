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

    /**
     * Fetch SERP results and find the exact position of a target URL.
     * 
     * @param string $keyword
     * @param string $targetUrlSlug
     * @param int $limit
     * @return int|null Returns the position (1-based) or null if not found.
     */
    public function findUrlPosition(string $keyword, string $targetUrlSlug, int $limit = 50): ?int
    {
        if (!$this->apiKey) return null;

        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(20)
            ->post('https://google.serper.dev/search', [
                'q' => $keyword,
                'gl' => 'br',
                'hl' => 'pt-br',
                'num' => $limit,
            ]);

            if (!$response->successful()) return null;

            $data = $response->json();
            $organicResults = $data['organic'] ?? [];
            
            foreach ($organicResults as $index => $result) {
                if (isset($result['link']) && str_contains($result['link'], $targetUrlSlug)) {
                    return $index + 1; // 1-based position
                }
            }

            return null;

        } catch (\Throwable $e) {
            Log::error('Exception caught while finding URL position from Serper.dev', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
