<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\ClientInteraction;
use App\Models\ClientReport;
use App\Services\Ga4ReportingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ClientReportController extends Controller
{
    protected Ga4ReportingService $ga4;

    public function __construct(Ga4ReportingService $ga4)
    {
        $this->ga4 = $ga4;
    }

    /**
     * Agrega todos os dados para o Preview do Relatório.
     * Retorna dados brutos + override possível antes de salvar.
     */
    public function preview(Request $request, $clienteId)
    {
        $cliente = Cliente::findOrFail($clienteId);

        // Busca o contrato ativo mais recente
        $autorizacao = \App\Models\Autorizacao::where('cliente_id', $clienteId)
            ->where('status', 'assinado')
            ->orderBy('data_inicio', 'desc')
            ->first();

        $contractStart = $autorizacao ? $autorizacao->data_inicio : null;
        $contractEnd = $autorizacao ? $autorizacao->data_fim : $cliente->contract_ends_at;

        $period    = $request->query('period', '30d');
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');

        // 1. Dados GA4 filtrados pelo nome do cliente (breakdown por cidade)
        $ga4Data = $this->ga4->getClientReportData(
            $cliente->nome_fantasia,
            $period,
            $startDate,
            $endDate
        );

        // 2. Conversões do banco de dados (WhatsApp, Waze, Social)
        $interactionQuery = ClientInteraction::where('cliente_id', $clienteId);

        if ($startDate && $endDate) {
            $interactionQuery->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        } else {
            $days = match($period) {
                '7d'         => 7,
                '90d'        => 90,
                '365d'       => 365,
                '12m'        => 365,
                'this_month' => now()->day,
                'last_month' => now()->subMonth()->daysInMonth,
                default      => 30,
            };
            $interactionQuery->where('created_at', '>=', now()->subDays($days));
        }

        $interactions = $interactionQuery
            ->selectRaw('interaction_type, count(*) as total')
            ->groupBy('interaction_type')
            ->get()
            ->pluck('total', 'interaction_type');

        $whatsappClicks = (int)($interactions['whatsapp_click'] ?? 0);
        $wazeClicks     = (int)($interactions['waze_click'] ?? 0);
        $socialClicks   = (int)($interactions['social_click'] ?? 0);
        $dbViews        = (int)($interactions['page_view'] ?? 0);

        // 3. Buscas do portal pelo nome do cliente
        $portalSearches = DB::table('search_logs')
            ->where('term', 'ilike', '%' . $cliente->nome_fantasia . '%')
            ->count();

        // 4. Posição/Ranking no segmento (count de clientes com mais interações)
        $rank = null;
        if ($cliente->segmento_id) {
            $rank = Cliente::where('segmento_id', $cliente->segmento_id)
                ->withCount('interacoes')
                ->orderBy('interacoes_count', 'desc')
                ->get()
                ->search(fn($c) => $c->id === (int)$clienteId) + 1; // 1-indexed
        }

        // 5. Histórico diário (sparkline dos últimos 30 dias)
        $sparkline = ClientInteraction::where('cliente_id', $clienteId)
            ->where('interaction_type', 'page_view')
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw("DATE(created_at) as date, count(*) as total")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 6. Label do período
        $periodLabel = match($period) {
            '7d'         => 'Últimos 7 dias',
            '30d'        => 'Últimos 30 dias',
            '90d'        => 'Últimos 90 dias',
            '365d'       => 'Últimos 12 meses',
            '12m'        => 'Últimos 12 meses',
            'this_month' => 'Mês Atual (' . now()->translatedFormat('F Y') . ')',
            'last_month' => 'Mês Anterior (' . now()->subMonth()->translatedFormat('F Y') . ')',
            default      => 'Últimos 30 dias',
        };
        if ($startDate && $endDate) {
            $periodLabel = date('d/m/Y', strtotime($startDate)) . ' a ' . date('d/m/Y', strtotime($endDate));
        }

        return response()->json([
            'cliente' => [
                'id'             => $cliente->id,
                'nome_fantasia'  => $cliente->nome_fantasia,
                'segmento'       => $cliente->segmento?->nome ?? null,
                'logo_url'       => $cliente->logo_url ?? null,
                'cidade'         => $cliente->enderecos?->first()?->cidade ?? null,
                'estado'         => $cliente->enderecos?->first()?->estado ?? null,
                'contract_starts_at' => $contractStart,
                'contract_ends_at'   => $contractEnd,
            ],
            'period_label'    => $periodLabel,
            'period'          => $period,
            'start_date'      => $startDate,
            'end_date'        => $endDate,

            // GA4 (editáveis no preview)
            'ga4' => [
                'total_views'  => $ga4Data['total_views'],
                'total_users'  => $ga4Data['total_users'],
                'avg_time'     => $ga4Data['avg_time'],     // segundos
                'total_events' => $ga4Data['total_events'],
                'cities'       => $ga4Data['cities'],
                'status'       => $ga4Data['total_views'] > 0 ? 'active' : 'fallback',
                'error'        => $ga4Data['error'] ?? null,
            ],

            // Banco de Dados (editáveis no preview)
            'conversions' => [
                'whatsapp' => $whatsappClicks,
                'waze'     => $wazeClicks,
                'social'   => $socialClicks,
                'db_views' => $dbViews,
            ],

            // Dados extras
            'portal_searches' => $portalSearches,
            'rank'            => $rank,
            'sparkline'       => $sparkline,
        ]);
    }

    /**
     * Salva o relatório (com dados manuais sobrepostos) e gera o token.
     */
    public function store(Request $request, $clienteId)
    {
        $request->validate([
            'period_label'   => 'required|string|max:120',
            'data'           => 'required|array',
            'notes'          => 'nullable|string|max:2000',
            'start_date'     => 'nullable|date',
            'end_date'       => 'nullable|date',
        ]);

        $report = ClientReport::create([
            'cliente_id'    => $clienteId,
            'generated_by'  => Auth::id(),
            'period_label'  => $request->period_label,
            'start_date'    => $request->start_date,
            'end_date'      => $request->end_date,
            'data'          => $request->data,
            'notes'         => $request->notes,
            'status'        => 'draft',
        ]);

        $dashboardUrl = env('DASHBOARD_URL', 'https://dash.overmelhinho.com.br');
        return response()->json([
            'id'      => $report->id,
            'token'   => $report->token,
            'link'    => "{$dashboardUrl}/relatorio/{$report->token}",
            'message' => 'Relatório gerado com sucesso!',
        ], 201);
    }

    /**
     * Lista relatórios de um cliente.
     */
    public function index($clienteId)
    {
        $reports = ClientReport::where('cliente_id', $clienteId)
            ->with('generatedBy:id,name')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'token', 'period_label', 'status', 'viewed_at', 'created_at', 'generated_by', 'data']);

        return response()->json($reports);
    }

    /**
     * Endpoint PÚBLICO: exibe o relatório pelo token (o que o cliente vê).
     * Registra quando foi aberto.
     */
    public function showPublic($token)
    {
        $report = ClientReport::where('token', $token)
            ->with('cliente')
            ->firstOrFail();

        // Marca como visualizado na primeira abertura
        if (!$report->viewed_at) {
            $report->update(['viewed_at' => now(), 'status' => 'viewed']);
        }

        return response()->json($report);
    }

    /**
     * Marca relatório como enviado (muda status para 'sent').
     */
    public function markAsSent($id)
    {
        $report = ClientReport::findOrFail($id);
        $report->update(['status' => 'sent']);
        return response()->json(['message' => 'Relatório marcado como enviado.']);
    }

    /**
     * Exclui um relatório de performance.
     */
    public function destroy($id)
    {
        $report = ClientReport::findOrFail($id);
        $report->delete();

        return response()->json(['message' => 'Relatório excluído com sucesso!']);
    }
}
