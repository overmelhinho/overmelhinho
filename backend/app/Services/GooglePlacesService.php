<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GooglePlacesService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.google.places_key');
    }

    /**
     * Busca uma lista de locais baseada em uma query.
     */
    public function searchPlaces(string $query): array
    {
        if (!$this->apiKey) return [];

        try {
            $response = Http::get("https://maps.googleapis.com/maps/api/place/textsearch/json", [
                'query' => $query,
                'key' => $this->apiKey,
                'language' => 'pt-BR'
            ]);

            if (!$response->successful()) {
                return [];
            }

            return $response->json('results') ?? [];
        } catch (\Throwable $e) {
            Log::error('[GooglePlacesService] Erro ao pesquisar locais', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Busca detalhes de um local, incluindo horários de funcionamento.
     */
    public function getDetailsByQuery(string $query): ?array
    {
        if (!$this->apiKey) {
            Log::warning('[GooglePlacesService] API Key não configurada.');
            return null;
        }

        try {
            // 1. Buscar o Place ID
            $searchResponse = Http::get("https://maps.googleapis.com/maps/api/place/textsearch/json", [
                'query' => $query,
                'key' => $this->apiKey,
                'language' => 'pt-BR'
            ]);

            if (!$searchResponse->successful() || empty($searchResponse['results'])) {
                return null;
            }

            $placeId = $searchResponse['results'][0]['place_id'];

            return $this->getDetails($placeId);

        } catch (\Throwable $e) {
            Log::error('[GooglePlacesService] Erro ao buscar detalhes', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Busca detalhes específicos por Place ID (inclui reviews)
     */
    public function getDetails(string $placeId): ?array
    {
        if (!$this->apiKey) return null;

        try {
            $response = Http::get("https://maps.googleapis.com/maps/api/place/details/json", [
                'place_id' => $placeId,
                'key' => $this->apiKey,
                'fields' => 'name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,geometry,business_status,reviews,place_id',
                'language' => 'pt-BR'
            ]);

            if ($response->failed()) {
                Log::error('[GooglePlacesService] Falha na HTTP response do Details', ['status' => $response->status(), 'body' => $response->body()]);
                return null;
            }

            return $response->json('result');
        } catch (\Throwable $e) {
            Log::error('[GooglePlacesService] Erro ao buscar detalhes por ID', ['id' => $placeId, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Busca apenas os reviews
     */
    public function getReviews(string $placeId): array
    {
        $details = $this->getDetails($placeId);
        
        if (!$details) {
            Log::warning('[GooglePlacesService] getReviews: detalhes não retornados para o ID ' . $placeId);
            return [];
        }

        return $details['reviews'] ?? [];
    }

    /**
     * Converte o formato do Google (0-6, sendo 0 domingo) para o formato do sistema (1-7).
     */
    public function mapOpeningHoursToSystem(array $openingHours): array
    {
        $map = [];
        $periods = $openingHours['periods'] ?? [];

        foreach ($periods as $period) {
            $day = $period['open']['day']; // 0 = Sunday (Google)
            $systemDay = ($day === 0) ? 7 : $day; // Convert: 0→7, 1→1, ..., 6→6

            $openTime  = substr($period['open']['time'], 0, 2) . ':' . substr($period['open']['time'], 2, 2);
            $closeTime = isset($period['close'])
                ? substr($period['close']['time'], 0, 2) . ':' . substr($period['close']['time'], 2, 2)
                : '23:59';

            if (!isset($map[$systemDay])) {
                // Primeiro período do dia: guarda abertura e fechamento
                $map[$systemDay] = [
                    'day'    => $systemDay,
                    'open'   => $openTime,
                    'close'  => $closeTime,
                    'open2'  => '',
                    'close2' => '',
                    'closed' => false,
                ];
            } else {
                // Período adicional (ex: tarde após almoço): guarda no 2º turno
                $map[$systemDay]['open2'] = $openTime;
                $map[$systemDay]['close2'] = $closeTime;
            }
        }

        // Preencher dias faltantes como fechados (sem horário pré-definido)
        for ($i = 1; $i <= 7; $i++) {
            if (!isset($map[$i])) {
                $map[$i] = [
                    'day'    => $i,
                    'open'   => '',
                    'close'  => '',
                    'open2'  => '',
                    'close2' => '',
                    'closed' => true,
                ];
            }
        }

        ksort($map);
        return array_values($map);
    }
}
