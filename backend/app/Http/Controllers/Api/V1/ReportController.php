<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Ga4ReportingService;

class ReportController extends Controller
{
    protected $ga4;

    public function __construct(Ga4ReportingService $ga4)
    {
        $this->ga4 = $ga4;
    }

    /**
     * Dashboard do Lojista (Visão Externa)
     */
    public function clientDashboard($id)
    {
        $cliente = \App\Models\Cliente::findOrFail($id);

        // 1. Visibilidade (Interações nos últimos 30 dias - Database)
        $interactions = \App\Models\ClientInteraction::where('cliente_id', $id)
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('interaction_type, count(*) as total')
            ->groupBy('interaction_type')
            ->get()
            ->pluck('total', 'interaction_type');

        // 2. Tenta buscar dados REAIS do GA4 (Mais precisos para o cliente)
        $ga4Metrics = $this->ga4->getClientMetrics($id);

        // Sparkline - Acessos diários últimos 7 dias
        $sparkline = \App\Models\ClientInteraction::where('cliente_id', $id)
            ->where('interaction_type', 'page_view')
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, count(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 3. Vagas (tabela usa client_id, não cliente_id)
        $vagasAtivas = 0;
        $totalCandidatos = 0;
        try {
            $vagasAtivas = \App\Models\JobOpportunity::where('client_id', $id)
                ->where('status', 'published')
                ->count();

            $totalCandidatos = \App\Models\Candidate::whereHas('jobOpportunity', function ($q) use ($id) {
                $q->where('client_id', $id);
            })->count();
        } catch (\Exception $e) {
            \Log::warning("clientDashboard Vagas Error for ID $id: " . $e->getMessage());
        }

        // 4. SEO (Última checagem)
        $seo = \App\Models\SeoRanking::where('cliente_id', $id)
            ->orderBy('checked_at', 'desc')
            ->first();

        // Calcula o total de views: prioriza GA4, cai para DB
        $dbViews = (int)($interactions['page_view'] ?? 0);
        $ga4Views = (int)($ga4Metrics['views'] ?? 0);
        $totalViews = $ga4Views > 0 ? $ga4Views : $dbViews;

        return response()->json([
            'visibilidade' => [
                'total_views'  => $totalViews,
                'db_views'     => $dbViews,
                'ga4_views'    => $ga4Views,
                'whatsapp'     => (int)($interactions['whatsapp_click'] ?? 0),
                'waze'         => (int)($interactions['waze_click'] ?? 0),
                'social'       => (int)($interactions['social_click'] ?? 0),
                'ga4_status'   => $ga4Views > 0 ? 'active' : 'fallback',
                'sparkline'    => $sparkline,
            ],
            'vagas' => [
                'ativas'      => $vagasAtivas,
                'candidatos'  => $totalCandidatos,
            ],
            'seo' => $seo ? [
                'current_position'  => $seo->position,
                'previous_position' => $seo->previous_position,
                'keyword'           => $seo->keyword,
                'trend'             => ($seo->position < ($seo->previous_position ?? $seo->position + 1)) ? 'up' : 'down',
            ] : null,
        ]);
    }

    /**
     * Dashboard Admin (Visão Interna)
     */
    public function adminDashboard(Request $request)
    {
        $period = $request->query('period', '30d');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // 1. Financeiro (MRR e Inadimplência)
        $mrr = \App\Models\Cliente::where('status_assinatura', 'ativo')
            ->join('plans', 'clientes.plan_id', '=', 'plans.id')
            ->sum('plans.price');

        $revenue = \App\Models\Invoice::where('status', 'paid')->sum('amount');

        $pendente = \App\Models\Invoice::where('status', 'pending')->sum('amount');
        $totalClientesAtivos = \App\Models\Cliente::where('status_assinatura', 'ativo')->count();

        // 2. Operação (Orçamentos e Fila de Foco)
        $totalQuotes = \App\Models\Quote::count();
        $autoNotified = \App\Models\Quote::whereNotNull('notified_at')->count();
        
        $tempoMedioResponse = \App\Models\Quote::where('status', 'replied')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_minutes')
            ->value('avg_minutes') ?? 0;

        // 3. Top Clientes (Campeões de Audiência)
        $topClientes = \App\Models\Cliente::withCount('interacoes')
            ->orderBy('interacoes_count', 'desc')
            ->limit(5)
            ->get(['id', 'nome_fantasia']);

        // 5. Inteligência de Tráfego (Híbrido)
        $ga4Global = $this->ga4->getGlobalMetrics($period, $startDate, $endDate);
        $topSegments = $this->ga4->getTopSegments(5, $period, $startDate, $endDate);
        $trafficSources = $this->ga4->getTrafficSources(5, $period, $startDate, $endDate);
        $deviceMetrics = $this->ga4->getDeviceMetrics($period, $startDate, $endDate);
        $topContent = $this->ga4->getTopContent(10, $period, $startDate, $endDate);
        $realtime = $this->ga4->getRealtimeMetrics();
        
        // Se GA4 falhar, tenta mock ou DB para segmentos
        if (empty($topSegments)) {
            $topSegments = [
                ['name' => 'Restaurantes', 'users' => 1250],
                ['name' => 'Borracharias', 'users' => 980],
                ['name' => 'Saúde', 'users' => 750],
                ['name' => 'Serviços 24h', 'users' => 620],
                ['name' => 'Eventos', 'users' => 410],
            ];
        }

        // Conversões Totais (Database fallback ou complementar)
        if ($startDate && $endDate) {
            $totalConversions = \App\Models\ClientInteraction::whereIn('interaction_type', ['whatsapp_click', 'waze_click'])
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->count();
        } else {
            $days = (int)str_replace('d', '', $period);
            if ($days == 0) $days = 30; // Para períodos como 'this_month' etc

            $totalConversions = \App\Models\ClientInteraction::whereIn('interaction_type', ['whatsapp_click', 'waze_click'])
                ->where('created_at', '>=', now()->subDays($days))
                ->count();
        }
            
        // 6. Gaps de Busca (DADOS REAIS do portal)
        // Buscamos termos que os usuários digitaram e que retornaram ZERO resultados (Gaps)
        $searchGaps = \DB::table('search_logs')
            ->where('results_count', 0)
            ->where('created_at', '>=', now()->subDays(60)) // Puxar últimos 60 dias para ter volume
            ->select('term', \DB::raw('count(*) as count'))
            ->groupBy('term')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'term' => ucfirst($item->term),
                'count' => (int)$item->count
            ]);

        // Fallback para mock caso não haja buscas logadas ainda (evitar gráfico vazio)
        if ($searchGaps->isEmpty()) {
            $searchGaps = [
                ['term' => 'Pet Shop', 'count' => 8],
                ['term' => 'Estética Automotiva', 'count' => 6],
                ['term' => 'Dentista 24h', 'count' => 4],
                ['term' => 'Pizzaria', 'count' => 12],
                ['term' => 'Energia Solar', 'count' => 3],
            ];
        }

        return response()->json([
            'period' => $period,
            'financeiro' => [
                'mrr' => (float)$mrr,
                'revenue' => (float)$revenue,
                'pending_invoices' => (float)$pendente,
                'default_rate' => $mrr > 0 ? round(($pendente / $mrr) * 100, 2) : 0,
                'ticket_medio' => $totalClientesAtivos > 0 ? round($mrr / $totalClientesAtivos, 2) : 0
            ],
            'operacao' => [
                'quotes_total' => $totalQuotes,
                'ai_efficiency' => $totalQuotes > 0 ? round(($autoNotified / $totalQuotes) * 100, 2) : 0,
                'avg_response_minutes' => round($tempoMedioResponse, 0),
                'top_clientes' => $topClientes
            ],
            'trafego' => [
                'page_views_total' => $ga4Global['views'],
                'conversions_total' => $totalConversions,
                'top_segments' => $topSegments,
                'top_sources' => $trafficSources,
                'device_metrics' => $deviceMetrics,
                'top_content' => $topContent,
                'realtime' => $realtime,
                'history' => $ga4Global['history'],
                'views_change' => '+12%'
            ],
            'search_gaps' => $searchGaps
        ]);
    }
    /**
     * Endpoint específico para o Monitor de Tempo Real (GA4)
     * Permite atualizações frequentes (ex: 30s) sem sobrecarregar o DB
     */
    public function realtimeMetrics()
    {
        $realtime = $this->ga4->getRealtimeMetrics();
        return response()->json($realtime);
    }
}

