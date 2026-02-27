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

        // 1. Visibilidade (Interações nos últimos 30 dias - Database Fallback)
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

        // 3. Vagas
        $vagasAtivas = \App\Models\JobOpportunity::where('cliente_id', $id)
            ->where('status', 'published')
            ->count();

        $totalCandidatos = \App\Models\Candidate::whereHas('jobOpportunity', function($q) use ($id) {
            $q->where('cliente_id', $id);
        })->count();

        // 4. SEO (Última checagem)
        $seo = \App\Models\SeoRanking::where('cliente_id', $id)
            ->orderBy('checked_at', 'desc')
            ->first();

        return response()->json([
            'visibilidade' => [
                // Prioriza GA4 se houver dados, senão usa DB
                'total_views' => max($interactions['page_view'] ?? 0, $ga4Metrics['views']),
                'whatsapp' => max($interactions['whatsapp_click'] ?? 0, $ga4Metrics['conversions'] / 2), // Estimativa se vier misto
                'waze' => $interactions['waze_click'] ?? 0,
                'social' => $interactions['social_click'] ?? 0,
                'ga4_status' => $ga4Metrics['views'] > 0 ? 'active' : 'fallback',
                'sparkline' => $sparkline
            ],
            'vagas' => [
                'ativas' => $vagasAtivas,
                'candidatos' => $totalCandidatos
            ],
            'seo' => $seo ? [
                'current_position' => $seo->position,
                'previous_position' => $seo->previous_position,
                'keyword' => $seo->keyword,
                'trend' => ($seo->position < ($seo->previous_position ?? $seo->position + 1)) ? 'up' : 'down'
            ] : null
        ]);
    }

    /**
     * Dashboard Admin (Visão Interna)
     */
    public function adminDashboard()
    {
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
        $ga4Global = $this->ga4->getGlobalMetrics(30);
        $topSegments = $this->ga4->getTopSegments(5);
        
        // Se GA4 falhar, tenta mock ou DB
        if (empty($topSegments)) {
            $topSegments = [
                ['name' => 'Restaurantes', 'users' => 1250],
                ['name' => 'Borracharias', 'users' => 980],
                ['name' => 'Saúde', 'users' => 750],
                ['name' => 'Serviços 24h', 'users' => 620],
                ['name' => 'Eventos', 'users' => 410],
            ];
        }

        // Conversões Totais (Database)
        $totalConversions = \App\Models\ClientInteraction::whereIn('interaction_type', ['whatsapp_click', 'waze_click'])
            ->where('created_at', '>=', now()->subDays(30))
            ->count();
            
        // Gaps de Busca (Mock até termos a integração com Search Trends ativa)    
        $searchGaps = [
            ['term' => 'Pet Shop', 'count' => 850],
            ['term' => 'Estética Automotiva', 'count' => 620],
            ['term' => 'Dentista 24h', 'count' => 410],
            ['term' => 'Pizzaria', 'count' => 1200],
            ['term' => 'Energia Solar', 'count' => 300],
        ];

        return response()->json([
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
                'history' => $ga4Global['history'],
                'views_change' => '+12%' // Mock para exemplo, pode ser calculado comparando com período anterior
            ],
            'search_gaps' => $searchGaps
        ]);
    }
}

