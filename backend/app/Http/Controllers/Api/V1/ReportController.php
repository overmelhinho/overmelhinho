<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Dashboard do Lojista (Visão Externa)
     */
    public function clientDashboard($id)
    {
        $cliente = \App\Models\Cliente::findOrFail($id);

        // 1. Visibilidade (Interações nos últimos 30 dias)
        $interactions = \App\Models\ClientInteraction::where('cliente_id', $id)
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('interaction_type, count(*) as total')
            ->groupBy('interaction_type')
            ->get()
            ->pluck('total', 'interaction_type');

        // Sparkline - Acessos diários últimos 7 dias
        $sparkline = \App\Models\ClientInteraction::where('cliente_id', $id)
            ->where('interaction_type', 'page_view')
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, count(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 2. Vagas
        $vagasAtivas = \App\Models\JobOpportunity::where('cliente_id', $id)
            ->where('status', 'published')
            ->count();

        $totalCandidatos = \App\Models\Candidate::whereHas('jobOpportunity', function($q) use ($id) {
            $q->where('cliente_id', $id);
        })->count();

        // 3. SEO (Última checagem)
        $seo = \App\Models\SeoRanking::where('cliente_id', $id)
            ->orderBy('checked_at', 'desc')
            ->first();

        return response()->json([
            'visibilidade' => [
                'total_views' => $interactions['page_view'] ?? 0,
                'whatsapp' => $interactions['whatsapp_click'] ?? 0,
                'waze' => $interactions['waze_click'] ?? 0,
                'social' => $interactions['social_click'] ?? 0,
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

        // 4. Gaps de Busca (Mock)
        $searchGaps = [
            ['term' => 'guinho 24h em cambara', 'count' => 45],
            ['term' => 'borracharia aberta agora', 'count' => 32],
            ['term' => 'aluguel de gerador', 'count' => 18],
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
            'search_gaps' => $searchGaps
        ]);
    }
}
