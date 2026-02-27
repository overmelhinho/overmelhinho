<?php

namespace App\Services;

use Google\Analytics\Data\V1beta\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Filter;
use Google\Analytics\Data\V1beta\FilterExpression;
use Google\Analytics\Data\V1beta\FilterExpressionList;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\OrderBy;

class Ga4ReportingService
{
    protected string $propertyId;

    public function __construct()
    {
        $this->propertyId = env('GA4_PROPERTY_ID', '');
    }

    /**
     * Consulta métricas do GA4 filtrando por client_id (Dimensão Customizada).
     * 
     * @param int $clientId
     * @param int $days
     * @return array
     */
    public function getClientMetrics($clientId, $days = 30)
    {
        if (empty($this->propertyId)) {
            return ['views' => 0, 'conversions' => 0];
        }

        // Recomendado configurar a variável GOOGLE_APPLICATION_CREDENTIALS no .env
        // com o caminho do arquivo JSON da conta de serviço.
        $client = new BetaAnalyticsDataClient();

        try {
            $response = $client->runReport([
                'property' => 'properties/' . $this->propertyId,
                'dateRanges' => [
                    new DateRange([
                        'start_date' => $days . 'daysAgo',
                        'end_date' => 'today',
                    ]),
                ],
                'dimensions' => [
                    new Dimension(['name' => 'eventName']),
                ],
                'metrics' => [
                    new Metric(['name' => 'eventCount']),
                    new Metric(['name' => 'activeUsers']),
                ],
                'dimensionFilter' => new FilterExpression([
                    'filter' => new Filter([
                        'field_name' => 'customEvent:client_id', // Nome da dimensão no GA4
                        'string_filter' => new Filter\StringFilter([
                            'value' => (string) $clientId,
                            'match_type' => Filter\StringFilter\MatchType::EXACT
                        ]),
                    ]),
                ]),
            ]);

            $metrics = [
                'views' => 0,
                'conversions' => 0
            ];

            foreach ($response->getRows() as $row) {
                $eventName = $row->getDimensionValues()[0]->getValue();
                $count = (int) $row->getMetricValues()[0]->getValue();

                if ($eventName === 'page_view') {
                    $metrics['views'] += $count;
                } elseif (str_contains($eventName, '_click')) {
                    $metrics['conversions'] += $count;
                }
            }

            return $metrics;

        } catch (\Exception $e) {
            return ['views' => 0, 'conversions' => 0];
        } finally {
            $client->close();
        }
    }

    /**
     * Consulta métricas globais do portal para o Dashboard Admin.
     * 
     * @param int $days
     * @return array
     */
    public function getGlobalMetrics($days = 30)
    {
        if (empty($this->propertyId)) {
            return ['views' => 0, 'conversions' => 0, 'history' => []];
        }

        $client = new BetaAnalyticsDataClient();

        try {
            $response = $client->runReport([
                'property' => 'properties/' . $this->propertyId,
                'dateRanges' => [
                    new DateRange(['start_date' => $days . 'daysAgo', 'end_date' => 'today']),
                ],
                'dimensions' => [
                    new Dimension(['name' => 'date']),
                ],
                'metrics' => [
                    new Metric(['name' => 'screenPageViews']),
                    new Metric(['name' => 'eventCount']),
                ],
            ]);

            $totalViews = 0;
            $totalConversions = 0;
            $history = [];

            foreach ($response->getRows() as $row) {
                $date = $row->getDimensionValues()[0]->getValue();
                $views = (int)$row->getMetricValues()[0]->getValue();
                $events = (int)$row->getMetricValues()[1]->getValue();
                
                $totalViews += $views;
                // Consideramos conversões eventos que terminam em _click
                // Como não temos filtro de evento aqui para performance, usamos o total de eventos como proxy ou refinamos
                // Para simplificar no global, vamos retornar o histórico por data
                $history[] = [
                    'date' => $date,
                    'views' => $views,
                    'events' => $events
                ];
            }

            // Ordena por data
            usort($history, fn($a, $b) => strcmp($a['date'], $b['date']));

            return [
                'views' => $totalViews,
                'conversions' => 0, // Será calculado via interações ou filtro mais específico se necessário
                'history' => $history
            ];

        } catch (\Exception $e) {
            return ['views' => 0, 'conversions' => 0, 'history' => []];
        } finally {
            $client->close();
        }
    }

    /**
     * Busca o ranking de segmentos por volume de tráfego.
     */
    public function getTopSegments($limit = 5)
    {
        if (empty($this->propertyId)) return [];

        $client = new BetaAnalyticsDataClient();

        try {
            $response = $client->runReport([
                'property' => 'properties/' . $this->propertyId,
                'dateRanges' => [
                    new DateRange(['start_date' => '30daysAgo', 'end_date' => 'today']),
                ],
                'dimensions' => [
                    new Dimension(['name' => 'customEvent:client_segment']),
                ],
                'metrics' => [
                    new Metric(['name' => 'activeUsers']),
                ],
                'limit' => $limit
            ]);

            $segments = [];
            foreach ($response->getRows() as $row) {
                $segments[] = [
                    'name' => $row->getDimensionValues()[0]->getValue() ?: 'Outros',
                    'users' => (int)$row->getMetricValues()[0]->getValue()
                ];
            }
            return $segments;
        } catch (\Exception $e) {
            return [];
        } finally {
            $client->close();
        }
    }
}

