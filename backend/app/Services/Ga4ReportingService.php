<?php

namespace App\Services;

use Google\Analytics\Data\V1beta\Client\BetaAnalyticsDataClient;
use Illuminate\Support\Facades\Log;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Filter;
use Google\Analytics\Data\V1beta\FilterExpression;
use Google\Analytics\Data\V1beta\FilterExpressionList;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\OrderBy;
use Google\Analytics\Data\V1beta\RunReportRequest;
use Google\Analytics\Data\V1beta\RunRealtimeReportRequest;


class Ga4ReportingService
{
    protected string $propertyId;

    public function __construct()
    {
        $this->propertyId = env('GA4_PROPERTY_ID', '');
        $credPath = env('GOOGLE_APPLICATION_CREDENTIALS', base_path('storage/app/google-credentials.json'));
        if (file_exists($credPath)) {
            putenv('GOOGLE_APPLICATION_CREDENTIALS=' . $credPath);
        }
    }

    /**
     * Helper para converter strings de período em DateRange do Google
     */
    private function getDateRangesFromPeriod($period = '30d', $startDate = null, $endDate = null)
    {
        if ($startDate && $endDate) {
            return [new DateRange(['start_date' => $startDate, 'end_date' => $endDate])];
        }

        switch ($period) {
            case '7d':
                return [new DateRange(['start_date' => '7daysAgo', 'end_date' => 'today'])];
            case '90d':
                return [new DateRange(['start_date' => '90daysAgo', 'end_date' => 'today'])];
            case 'this_month':
                return [new DateRange(['start_date' => date('Y-m-01'), 'end_date' => 'today'])];
            case 'last_month':
                return [new DateRange(['start_date' => date('Y-m-01', strtotime('last month')), 'end_date' => date('Y-m-t', strtotime('last month'))])];
            case '365d':
            case '12m':
                return [new DateRange(['start_date' => '365daysAgo', 'end_date' => 'today'])];
            case '30d':
            default:
                return [new DateRange(['start_date' => '30daysAgo', 'end_date' => 'today'])];
        }
    }

    /**
     * Consulta métricas do GA4 filtrando por client_id (Dimensão Customizada).
     * 
     * @param int $clientId
     * @param string $period
     * @return array
     */
    public function getClientMetrics($clientId, $period = '30d', $startDate = null, $endDate = null)
    {
        if (empty($this->propertyId)) {
            return ['views' => 0, 'conversions' => 0];
        }

        $client = new BetaAnalyticsDataClient();

        try {
            $response = $client->runReport(new RunReportRequest([
                'property' => 'properties/' . $this->propertyId,
                'date_ranges' => $this->getDateRangesFromPeriod($period, $startDate, $endDate),
                'dimensions' => [
                    new Dimension(['name' => 'eventName']),
                ],
                'metrics' => [
                    new Metric(['name' => 'eventCount']),
                    new Metric(['name' => 'activeUsers']),
                ],
                'dimension_filter' => new FilterExpression([
                    'filter' => new Filter([
                        'field_name' => 'customEvent:client_id', // Nome da dimensão no GA4
                        'string_filter' => new Filter\StringFilter([
                            'value' => (string) $clientId,
                            'match_type' => Filter\StringFilter\MatchType::EXACT
                        ]),
                    ]),
                ]),
            ]));

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
     * @param string $period
     * @return array
     */
    public function getGlobalMetrics($period = '30d', $startDate = null, $endDate = null)
    {
        if (empty($this->propertyId)) {
            return ['views' => 0, 'conversions' => 0, 'history' => []];
        }

        $client = new BetaAnalyticsDataClient();

        try {
            $response = $client->runReport(new RunReportRequest([
                'property' => 'properties/' . $this->propertyId,
                'date_ranges' => $this->getDateRangesFromPeriod($period, $startDate, $endDate),
                'dimensions' => [
                    new Dimension(['name' => 'date']),
                ],
                'metrics' => [
                    new Metric(['name' => 'screenPageViews']),
                    new Metric(['name' => 'eventCount']),
                ],
            ]));

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
    public function getTopSegments($limit = 5, $period = '30d', $startDate = null, $endDate = null)
    {
        if (empty($this->propertyId)) return [];

        $client = new BetaAnalyticsDataClient();

        try {
            $response = $client->runReport(new RunReportRequest([
                'property' => 'properties/' . $this->propertyId,
                'date_ranges' => $this->getDateRangesFromPeriod($period, $startDate, $endDate),
                'dimensions' => [
                    new Dimension(['name' => 'customEvent:client_segment']),
                ],
                'metrics' => [
                    new Metric(['name' => 'activeUsers']),
                ],
                'limit' => $limit
            ]));

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

    /**
     * Busca as origens de tráfego (Source/Medium).
     */
    public function getTrafficSources($limit = 5, $period = '30d', $startDate = null, $endDate = null)
    {
        if (empty($this->propertyId)) return [];

        $client = new BetaAnalyticsDataClient();
        try {
            $response = $client->runReport(new RunReportRequest([
                'property' => 'properties/' . $this->propertyId,
                'date_ranges' => $this->getDateRangesFromPeriod($period, $startDate, $endDate),
                'dimensions' => [new Dimension(['name' => 'sessionSourceMedium'])],
                'metrics' => [new Metric(['name' => 'activeUsers'])],
                'limit' => $limit
            ]));

            $sources = [];
            foreach ($response->getRows() as $row) {
                $sources[] = [
                    'name' => $row->getDimensionValues()[0]->getValue(),
                    'users' => (int)$row->getMetricValues()[0]->getValue()
                ];
            }
            return $sources;
        } catch (\Exception $e) {
            return [];
        } finally {
            $client->close();
        }
    }

    /**
     * Busca métricas por tipo de dispositivo (Mobile vs Desktop).
     */
    public function getDeviceMetrics($period = '30d', $startDate = null, $endDate = null)
    {
        if (empty($this->propertyId)) return [];

        $client = new BetaAnalyticsDataClient();
        try {
            $response = $client->runReport(new RunReportRequest([
                'property' => 'properties/' . $this->propertyId,
                'date_ranges' => $this->getDateRangesFromPeriod($period, $startDate, $endDate),
                'dimensions' => [new Dimension(['name' => 'deviceCategory'])],
                'metrics' => [new Metric(['name' => 'activeUsers'])]
            ]));

            $devices = [];
            foreach ($response->getRows() as $row) {
                $devices[] = [
                    'name' => $row->getDimensionValues()[0]->getValue(),
                    'users' => (int)$row->getMetricValues()[0]->getValue()
                ];
            }
            return $devices;
        } catch (\Exception $e) {
            return [];
        } finally {
            $client->close();
        }
    }

    /**
     * Busca as páginas mais vistas.
     */
    public function getTopContent($limit = 10, $period = '30d', $startDate = null, $endDate = null)
    {
        if (empty($this->propertyId)) return [];

        $client = new BetaAnalyticsDataClient();
        try {
            $response = $client->runReport(new RunReportRequest([
                'property' => 'properties/' . $this->propertyId,
                'date_ranges' => $this->getDateRangesFromPeriod($period, $startDate, $endDate),
                'dimensions' => [new Dimension(['name' => 'pageTitle']), new Dimension(['name' => 'pagePath'])],
                'metrics' => [new Metric(['name' => 'screenPageViews'])],
                'limit' => $limit
            ]));

            $content = [];
            foreach ($response->getRows() as $row) {
                $content[] = [
                    'title' => $row->getDimensionValues()[0]->getValue(),
                    'path' => $row->getDimensionValues()[1]->getValue(),
                    'views' => (int)$row->getMetricValues()[0]->getValue()
                ];
            }
            return $content;
        } catch (\Exception $e) {
            return [];
        } finally {
            $client->close();
        }
    }

    /**
     * Busca métricas em tempo real (últimos 30 minutos).
     */
    public function getRealtimeMetrics()
    {
        if (empty($this->propertyId)) return ['activeUsers' => 0, 'topPages' => []];

        $client = new BetaAnalyticsDataClient();
        try {
            // 1. Pega o Total (Exatamente como no teste standalone que funcionou)
            $requestTotal = new RunRealtimeReportRequest();
            $requestTotal->setProperty('properties/' . $this->propertyId);
            $requestTotal->setMetrics([new Metric(['name' => 'activeUsers'])]);

            $responseTotal = $client->runRealtimeReport($requestTotal);
            $activeUsersTotal = 0;
            
            if ($responseTotal->getRows() && count($responseTotal->getRows()) > 0) {
                $activeUsersTotal = (int)$responseTotal->getRows()[0]->getMetricValues()[0]->getValue();
            }

            // 2. Pega o Top de Páginas
            $topPages = [];
            try {
                $requestPages = new RunRealtimeReportRequest();
                $requestPages->setProperty('properties/' . $this->propertyId);
                // No Realtime, se usa "unifiedPageScreen" para o caminho/título da página
                $requestPages->setDimensions([new Dimension(['name' => 'unifiedPageScreen'])]);
                $requestPages->setMetrics([new Metric(['name' => 'activeUsers'])]);
                $requestPages->setLimit(5);

                $responsePages = $client->runRealtimeReport($requestPages);
                foreach ($responsePages->getRows() as $row) {
                    $topPages[] = [
                        'path' => $row->getDimensionValues()[0]->getValue(),
                        'users' => (int)$row->getMetricValues()[0]->getValue()
                    ];
                }
            } catch (\Exception $e) {
                Log::warning("GA4 Realtime Pages Error: " . $e->getMessage());
                // Não falha a requisição total se as páginas falharem
            }

            return [
                'activeUsers' => $activeUsersTotal,
                'topPages' => $topPages
            ];
        } catch (\Exception $e) {
            Log::error("GA4 Realtime Error: " . $e->getMessage());
            return ['activeUsers' => 0, 'topPages' => [], 'error' => $e->getMessage()];
        } finally {
            $client->close();
        }
    }

    /**
     * Busca dados GA4 filtrados pelo nome do cliente no título da página.
     * Retorna total + breakdown por cidade (como screenshot do GA4).
     */
    public function getClientReportData(string $clientName, $period = '30d', $startDate = null, $endDate = null): array
    {
        if (empty($this->propertyId) || empty($clientName)) {
            return ['total_views' => 0, 'total_users' => 0, 'avg_time' => 0, 'total_events' => 0, 'cities' => []];
        }

        $gaClient = new BetaAnalyticsDataClient();
        try {
            $request = new RunReportRequest();
            $request->setProperty('properties/' . $this->propertyId);
            $request->setDateRanges($this->getDateRangesFromPeriod($period, $startDate, $endDate));
            $request->setDimensions([new Dimension(['name' => 'pageTitle'])]);
            $request->setMetrics([
                new Metric(['name' => 'screenPageViews']),
                new Metric(['name' => 'activeUsers']),
                new Metric(['name' => 'userEngagementDuration']),
                new Metric(['name' => 'eventCount']),
            ]);

            // Filtro simplificado: Buscamos as 2 primeiras palavras (ex: "São Bento") para abranger as variações
            $searchQuery = $clientName;
            $words = explode(' ', trim($clientName));
            if (count($words) >= 2) {
                $searchQuery = $words[0] . ' ' . $words[1];
                if (mb_strlen($searchQuery) < 5 && count($words) >= 3) {
                     $searchQuery .= ' ' . $words[2];
                }
            }

            $sf = new Filter\StringFilter();
            $sf->setValue($searchQuery);
            $sf->setMatchType(Filter\StringFilter\MatchType::CONTAINS);
            $sf->setCaseSensitive(false);
            $f = new Filter();
            $f->setFieldName('pageTitle');
            $f->setStringFilter($sf);
            $fe = new FilterExpression();
            $fe->setFilter($f);
            $request->setDimensionFilter($fe);

            // Ordenar por views desc
            $ob = new OrderBy();
            $mob = new OrderBy\MetricOrderBy();
            $mob->setMetricName('screenPageViews');
            $ob->setMetric($mob);
            $ob->setDesc(true);
            $request->setOrderBys([$ob]);
            $request->setLimit(20);

            $response = $gaClient->runReport($request);

            $totalViews = $totalUsers = $totalTime = $totalEvents = 0;
            $cities = [];

            foreach ($response->getRows() as $row) {
                $title  = $row->getDimensionValues()[0]->getValue();
                $views  = (int)$row->getMetricValues()[0]->getValue();
                $users  = (int)$row->getMetricValues()[1]->getValue();
                $time   = (float)$row->getMetricValues()[2]->getValue();
                $events = (int)$row->getMetricValues()[3]->getValue();

                $totalViews  += $views;
                $totalUsers  += $users;
                $totalTime   += $time;
                $totalEvents += $events;

                $cities[] = [
                    'title'    => $title,
                    'views'    => $views,
                    'users'    => $users,
                    'avg_time' => $users > 0 ? round($time / $users) : 0,
                    'events'   => $events,
                ];
            }

            $avgTime = $totalUsers > 0 ? round($totalTime / $totalUsers) : 0;

            foreach ($cities as &$city) {
                $city['pct_views'] = $totalViews > 0 ? round(($city['views'] / $totalViews) * 100, 1) : 0;
                $city['pct_users'] = $totalUsers > 0 ? round(($city['users'] / $totalUsers) * 100, 1) : 0;
            }

            return [
                'total_views'  => $totalViews,
                'total_users'  => $totalUsers,
                'avg_time'     => $avgTime,
                'total_events' => $totalEvents,
                'cities'       => $cities,
            ];
        } catch (\Exception $e) {
            Log::error("GA4 ClientReportData Error: " . $e->getMessage());
            return ['total_views' => 0, 'total_users' => 0, 'avg_time' => 0, 'total_events' => 0, 'cities' => [], 'error' => $e->getMessage()];
        } finally {
            $gaClient->close();
        }

        return ['total_views' => 0, 'total_users' => 0, 'avg_time' => 0, 'total_events' => 0, 'cities' => [], 'error' => 'Unknown end of method'];
    }
}

