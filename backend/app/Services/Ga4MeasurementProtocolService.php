<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Ga4MeasurementProtocolService
{
    protected ?string $measurementId = null;
    protected ?string $apiSecret = null;

    public function __construct()
    {
        $this->measurementId = config('analytics.ga4.measurement_id') ?: env('GA4_MEASUREMENT_ID');
        $this->apiSecret = config('analytics.ga4.api_secret') ?: env('GA4_API_SECRET');
    }

    /**
     * Envia um evento de interação para o GA4 via Measurement Protocol.
     * 
     * @param int $clientId
     * @param string|null $segment
     * @param string|null $city
     * @param string $interactionType (whatsapp_click, waze_click, etc)
     */
    public function sendInteractionEvent($clientId, $segment, $city, $interactionType)
    {
        if (!$this->measurementId || !$this->apiSecret) {
            Log::warning('GA4 Measurement Protocol não configurado. Verifique GA4_MEASUREMENT_ID e GA4_API_SECRET.');
            return;
        }

        $url = "https://www.google-analytics.com/mp/collect?measurement_id={$this->measurementId}&api_secret={$this->apiSecret}";

        $payload = [
            'client_id' => 'server.' . $clientId . '.' . time(), // ID único para o GA4 (padrão server-side)
            'events' => [
                [
                    'name' => $interactionType,
                    'params' => [
                        'client_id' => (string) $clientId,
                        'client_segment' => (string) $segment,
                        'client_city' => (string) $city,
                        'engagement_time_msec' => '100',
                        'source' => 'server_side'
                    ]
                ]
            ]
        ];

        try {
            Http::post($url, $payload);
        } catch (\Exception $e) {
            Log::error('Erro ao enviar evento para o GA4: ' . $e->getMessage());
        }
    }
    /**
     * Envia um evento de anúncio (impressão ou clique) para o GA4.
     */
    public function sendAdEvent($adId, $adName, $placement, $type, $clientId = null, $clientName = null)
    {
        if (!$this->measurementId || !$this->apiSecret) return;

        $url = "https://www.google-analytics.com/mp/collect?measurement_id={$this->measurementId}&api_secret={$this->apiSecret}";

        $eventName = $type === 'view' ? 'ad_impression' : 'ad_click';

        $payload = [
            'client_id' => 'server.ad.' . $adId . '.' . time(),
            'events' => [
                [
                    'name' => $eventName,
                    'params' => [
                        'ad_id' => (string) $adId,
                        'ad_name' => (string) $adName,
                        'ad_placement' => (string) $placement,
                        'ad_format' => 'banner',
                        'client_id' => (string) $clientId,
                        'client_name' => (string) $clientName,
                        'engagement_time_msec' => '100',
                        'source' => 'server_side'
                    ]
                ]
            ]
        ];

        try {
            Http::post($url, $payload);
        } catch (\Exception $e) {
            Log::error('Erro ao enviar evento de anúncio para o GA4: ' . $e->getMessage());
        }
    }
}
