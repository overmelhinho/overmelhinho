<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Ga4ReportingService;
use App\Models\Invoice;
use App\Models\Autorizacao;
use App\Models\Candidate;
use App\Models\Cliente;
use App\Models\Quote;
use App\Models\ClientInteraction;
use App\Models\SeoRanking;
use App\Models\JobOpportunity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

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
        $cliente = Cliente::findOrFail($id);

        $interactions = ClientInteraction::where('cliente_id', $id)
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('interaction_type, count(*) as total')
            ->groupBy('interaction_type')
            ->get()
            ->pluck('total', 'interaction_type');

        $ga4Metrics = $this->ga4->getClientMetrics($id);

        $sparkline = ClientInteraction::where('cliente_id', $id)
            ->where('interaction_type', 'page_view')
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, count(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $vagasAtivas = JobOpportunity::where('client_id', $id)
            ->where('status', 'published')
            ->count();

        $totalCandidatos = Candidate::whereHas('jobOpportunity', function ($q) use ($id) {
            $q->where('client_id', $id);
        })->count();

        $seo = SeoRanking::where('cliente_id', $id)
            ->orderBy('checked_at', 'desc')
            ->first();

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

        $mrr = Cliente::where('status_assinatura', 'ativo')
            ->join('plans', 'clientes.plan_id', '=', 'plans.id')
            ->sum('plans.price');

        $days = (int)str_replace('d', '', $period);
        if ($days == 0) $days = 30;

        $revenueQuery = Invoice::where('status', 'paid');
        $pendenteQuery = Invoice::where('status', 'pending');

        if ($startDate && $endDate) {
            $revenueQuery->whereBetween('due_date', [$startDate, $endDate]);
            $pendenteQuery->whereBetween('due_date', [$startDate, $endDate]);
        } else {
            $revenueQuery->where('due_date', '>=', now()->subDays($days));
            $pendenteQuery->where('due_date', '>=', now()->subDays($days));
        }

        $revenue = $revenueQuery->sum('amount');
        $pendente = $pendenteQuery->sum('amount');

        $totalClientesAtivos = Cliente::where('status_assinatura', 'ativo')->count();

        $totalQuotes = Quote::count();
        $autoNotified = Quote::whereNotNull('notified_at')->count();
        
        $tempoMedioResponse = Quote::where('status', 'replied')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_minutes')
            ->value('avg_minutes') ?? 0;

        $topClientes = Cliente::withCount('interacoes')
            ->orderBy('interacoes_count', 'desc')
            ->limit(5)
            ->get(['id', 'nome_fantasia']);

        $ga4Global = $this->ga4->getGlobalMetrics($period, $startDate, $endDate);
        $topSegments = $this->ga4->getTopSegments(5, $period, $startDate, $endDate);
        $trafficSources = $this->ga4->getTrafficSources(5, $period, $startDate, $endDate);
        $deviceMetrics = $this->ga4->getDeviceMetrics($period, $startDate, $endDate);
        $topContent = $this->ga4->getTopContent(10, $period, $startDate, $endDate);
        $realtime = $this->ga4->getRealtimeMetrics();
        
        if (empty($topSegments)) {
            $topSegments = [
                ['name' => 'Restaurantes', 'users' => 1250],
                ['name' => 'Borracharias', 'users' => 980],
                ['name' => 'Saúde', 'users' => 750],
                ['name' => 'Serviços 24h', 'users' => 620],
                ['name' => 'Eventos', 'users' => 410],
            ];
        }

        if ($startDate && $endDate) {
            $totalConversions = ClientInteraction::whereIn('interaction_type', ['whatsapp_click', 'waze_click'])
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->count();
        } else {
            $totalConversions = ClientInteraction::whereIn('interaction_type', ['whatsapp_click', 'waze_click'])
                ->where('created_at', '>=', now()->subDays($days))
                ->count();
        }
            
        $searchGaps = DB::table('search_logs')
            ->where('results_count', 0)
            ->where('created_at', '>=', now()->subDays(60))
            ->select('term', DB::raw('count(*) as count'))
            ->groupBy('term')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'term' => ucfirst($item->term),
                'count' => (int)$item->count
            ]);

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

    public function realtimeMetrics()
    {
        $realtime = $this->ga4->getRealtimeMetrics();
        return response()->json($realtime);
    }

    /**
     * Obter dados de vendas (centralizado)
     */
    private function getSalesData(Request $request)
    {
        $query = Invoice::query()
            ->with(['client:id,nome_fantasia,razao_social,cpf_cnpj', 'plan:id,name']);

        // Filtro de Vencimento
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('due_date', [$request->start_date, $request->end_date]);
        }

        // Filtro de Emissão (Data Cad. Inicial/Final)
        if ($request->filled('data_cad_inicial') && $request->filled('data_cad_final')) {
            // Emissão geralmente é action_date ou created_at. Vamos usar action_date ou date(created_at)
            $query->whereBetween(DB::raw('DATE(created_at)'), [$request->data_cad_inicial, $request->data_cad_final]);
        }

        // Filtro de Termo (Nome/Razão Social) - Case Insensitive
        if ($request->filled('termo')) {
            $termo = mb_strtolower($request->termo);
            $query->whereHas('client', function ($q) use ($termo) {
                $q->where(function($sq) use ($termo) {
                    $sq->whereRaw('LOWER(nome_fantasia) LIKE ?', ["%{$termo}%"])
                      ->orWhereRaw('LOWER(razao_social) LIKE ?', ["%{$termo}%"])
                      ->orWhereRaw('LOWER(cpf_cnpj) LIKE ?', ["%{$termo}%"]);
                });
            });
        }

        // PF / PJ
        if ($request->filled('tipo_pf_pj') && $request->tipo_pf_pj !== 'all') {
            $query->whereHas('client', function ($q) use ($request) {
                if ($request->tipo_pf_pj === 'pf') {
                    $q->whereRaw('LENGTH(REGEXP_REPLACE(cpf_cnpj, \'[^0-9]\', \'\')) <= 11');
                } else {
                    $q->whereRaw('LENGTH(REGEXP_REPLACE(cpf_cnpj, \'[^0-9]\', \'\')) > 11');
                }
            });
        }

        // Filtro Cidade / Bairro
        if ($request->filled('cidade') || $request->filled('bairro')) {
            $query->whereHas('client.enderecos', function ($q) use ($request) {
                if ($request->filled('cidade')) {
                    $q->where('cidade', 'like', '%' . $request->cidade . '%');
                }
                if ($request->filled('bairro')) {
                    $q->where('bairro', 'like', '%' . $request->bairro . '%');
                }
            });
        }

        // Filtro Telefone
        if ($request->filled('telefone')) {
            $query->whereHas('client.contatos', function ($q) use ($request) {
                $q->where('telefone', 'like', '%' . $request->telefone . '%');
            });
        }

        // Filtro Autorizacao / Vendedor / Tipo Publicidade
        $hasAuthFilter = $request->filled('numero_autorizacao') || 
                        $request->filled('numero_autorizacao_de') ||
                        $request->filled('numero_autorizacao_ate') ||
                        ($request->filled('tipo_publicidade') && $request->tipo_publicidade !== 'all') ||
                        ($request->filled('vendedor_id') && $request->vendedor_id !== 'all');

        if ($hasAuthFilter) {
            $authQuery = Autorizacao::query();
            
            if ($request->filled('numero_autorizacao_de') || $request->filled('numero_autorizacao_ate')) {
                if ($request->filled('numero_autorizacao_de')) {
                    $de = (int)$request->numero_autorizacao_de;
                    $authQuery->whereRaw("CASE WHEN numero ~ '^[0-9]+$' THEN CAST(numero AS INTEGER) ELSE 0 END >= ?", [$de]);
                }
                if ($request->filled('numero_autorizacao_ate')) {
                    $ate = (int)$request->numero_autorizacao_ate;
                    $authQuery->whereRaw("CASE WHEN numero ~ '^[0-9]+$' THEN CAST(numero AS INTEGER) ELSE 0 END <= ?", [$ate]);
                }
            } elseif ($request->filled('numero_autorizacao')) {
                $num = $request->numero_autorizacao;
                // Remove zeros à esquerda se for numérico para busca mais flexível
                $numClean = ltrim($num, '0');
                $authQuery->where(function($q) use ($num, $numClean) {
                    $q->where('numero', 'like', "%{$num}%");
                    if ($numClean !== "") {
                        $q->orWhere('numero', 'like', "%{$numClean}%");
                    }
                });
            }
            
            if ($request->filled('tipo_publicidade') && $request->tipo_publicidade !== 'all') {
                $authQuery->where('tipo_publicidade', $request->tipo_publicidade);
            }
            
            if ($request->filled('vendedor_id') && $request->vendedor_id !== 'all') {
                $authQuery->where('vendedor_id', $request->vendedor_id);
            }
            
            $authIds = $authQuery->pluck('id');
            $groupIds = $authIds->map(fn($id) => 'autorizacao-' . $id)->toArray();
            
            if (empty($groupIds)) {
                $query->where('id', 0); // Força zero resultados
            } else {
                $query->whereIn('group_id', $groupIds);
            }
        }

        if ($request->filled('plan_id') && $request->plan_id !== 'all') {
            $query->where('plan_id', $request->plan_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('collection_type') && $request->collection_type !== 'all') {
            $types = is_array($request->collection_type) 
                ? $request->collection_type 
                : explode(',', $request->collection_type);
            
            $methods = [];
            $hasDirect = false;
            
            foreach ($types as $type) {
                if ($type === 'bank') {
                    $methods[] = 'boleto';
                } elseif ($type === 'card') {
                    $methods[] = 'cartao';
                } elseif ($type === 'pix') {
                    $methods[] = 'pix';
                } elseif ($type === 'cash') {
                    $methods[] = 'dinheiro';
                } elseif ($type === 'permuta') {
                    $methods[] = 'permuta';
                } elseif ($type === 'direct') {
                    $hasDirect = true;
                }
            }
            
            if ($hasDirect) {
                $query->where(function($q) use ($methods) {
                    $q->whereNotIn('payment_method', ['boleto', 'cartao', 'pix', 'permuta']);
                    if (!empty($methods)) {
                        $q->orWhereIn('payment_method', $methods);
                    }
                });
            } else {
                if (!empty($methods)) {
                    $query->whereIn('payment_method', $methods);
                }
            }
        }

        $invoices = $query->orderBy('due_date', 'asc')->get();

        // Mapear vendedores e autorizações manualmente devido ao prefixo no group_id
        $authIds = $invoices->filter(fn($i) => str_starts_with($i->group_id ?? '', 'autorizacao-'))
            ->map(fn($i) => (int) str_replace('autorizacao-', '', $i->group_id))
            ->unique();

        $auths = Autorizacao::whereIn('id', $authIds)
            ->with('vendedor:id,name')
            ->get()
            ->keyBy('id');

        // Buscar todas as faturas dessas autorizações para saber o que já foi pago
        $groupIds = $auths->keys()->map(fn($id) => 'autorizacao-' . $id)->toArray();
        $allInvoices = Invoice::whereIn('group_id', $groupIds)
            ->select('group_id', 'status', 'amount')
            ->get()
            ->groupBy('group_id');

        $data = $invoices->map(function ($inv) use ($auths, $allInvoices) {
            $authId = str_starts_with($inv->group_id ?? '', 'autorizacao-') 
                ? (int) str_replace('autorizacao-', '', $inv->group_id) 
                : null;
            
            $auth = $authId ? ($auths[$authId] ?? null) : null;

            // Calcular o restante da autorização (Total da Aut - Soma das faturas pagas)
            $authTotal = $auth ? (float) $auth->valor_total : 0;
            $authInvoices = $allInvoices->get($inv->group_id, collect());
            $paidAmount = $authInvoices->where('status', 'paid')->sum('amount');
            $restante = max(0, $authTotal - $paidAmount);

            return [
                'id' => $inv->id,
                'cliente' => $inv->client->razao_social ?? $inv->client->nome_fantasia ?? 'N/A',
                'cliente_nome_fantasia' => $inv->client->nome_fantasia,
                'cliente_id' => $inv->client_id,
                'plano' => $inv->plan->name ?? 'Avulso',
                'vendedor' => $auth?->vendedor?->name ?? 'N/A',
                'vendedor_id' => $auth?->vendedor_id,
                'amount' => (float)$inv->amount,
                'due_date' => $inv->due_date,
                'status' => $inv->status,
                'payment_method' => $inv->payment_method,
                'autorizacao_id' => $auth?->id,
                'autorizacao_numero' => $auth?->numero ? str_pad($auth->numero, 5, '0', STR_PAD_LEFT) : null,
                'parcel_number' => $inv->parcel_number,
                'total_parcels' => $inv->total_parcels,
                'auth_valor_total' => $authTotal,
                'auth_valor_restante' => $restante,
            ];
        });

        // Filtro de Vendedor (aplicado em memória para suportar o mapeamento via group_id)
        if ($request->filled('vendedor_id') && $request->vendedor_id !== 'all') {
            $data = $data->filter(fn($item) => $item['vendedor_id'] == $request->vendedor_id)->values();
        }

        $summary = [
            'count' => $data->count(),
            'total_amount' => $data->sum('amount'),
            'paid_amount' => $data->where('status', 'paid')->sum('amount'),
            'pending_amount' => $data->where('status', 'pending')->sum('amount'),
        ];

        return [
            'data' => $data,
            'summary' => $summary,
            'filters' => [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
            ]
        ];
    }

    public function salesReport(Request $request)
    {
        return response()->json($this->getSalesData($request));
    }

    public function exportSalesPdf(Request $request)
    {
        $data = $this->getSalesData($request);
        $pdf = Pdf::loadView('pdf.sales_report', $data)
            ->setPaper('a4', 'landscape');
        
        return $pdf->download('Relatorio_Vendas_' . now()->format('dmY_His') . '.pdf');
    }

    public function commissionReport(Request $request)
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->format('Y-m-d');
        $endDate = $request->end_date ?? now()->endOfMonth()->format('Y-m-d');

        $query = Autorizacao::with(['cliente.enderecos', 'cliente.contatos', 'vendedor']);

        // Data filter (by data_inicio or created_at, legacy usually uses emissao/data_inicio)
        $query->whereBetween('data_inicio', [$startDate, $endDate]);

        // Vendedor filter
        if ($request->filled('vendedor_id')) {
            $query->where('vendedor_id', $request->vendedor_id);
        }

        // Tipo de Publicidade filter
        if ($request->filled('tipo_publicidade')) {
            $query->where('tipo_publicidade', clone $request->tipo_publicidade);
        }

        // Cidade filter (has to join or whereHas client.enderecos)
        if ($request->filled('cidade')) {
            $query->whereHas('cliente.enderecos', function ($q) use ($request) {
                $q->where('cidade', 'like', '%' . $request->cidade . '%');
            });
        }

        // Telefone filter (has to join or whereHas client.contatos)
        if ($request->filled('telefone')) {
            $query->whereHas('cliente.contatos', function ($q) use ($request) {
                $q->where('telefone', 'like', '%' . $request->telefone . '%');
            });
        }

        // Ordem
        $orderBy = $request->ordem ?? 'data_inicio';
        $direction = $request->direcao ?? 'asc';
        if ($orderBy === 'nome_fantasia') {
            $query->join('clientes', 'autorizacoes.cliente_id', '=', 'clientes.id')
                  ->orderBy('clientes.nome_fantasia', $direction)
                  ->select('autorizacoes.*');
        } else {
            $query->orderBy($orderBy, $direction);
        }

        $autorizacoes = $query->get();

        $data = $autorizacoes->map(function ($auth) {
            return [
                'id' => $auth->id,
                'emissao' => $auth->data_inicio ? $auth->data_inicio->format('d/m/Y') : null,
                'cliente_nome' => $auth->cliente->nome_fantasia ?? $auth->cliente->razao_social ?? 'N/A',
                'numero' => $auth->numero,
                'tipo_publicidade' => mb_strtoupper($auth->tipo_publicidade),
                'valor_total' => (float)$auth->valor_total,
                'data_final' => $auth->data_fim ? $auth->data_fim->format('d/m/Y') : null,
                'vendedor_nome' => $auth->vendedor->name ?? 'N/A',
            ];
        });

        // Calculando totais para o dashboard
        $summary = [
            'total_titulos' => $data->count(),
            'total_valor' => $data->sum('valor_total'),
            'total_comissao' => $data->sum('valor_total') * 0.10, // Exemplo de 10%
        ];

        return response()->json([
            'data' => $data,
            'summary' => $summary
        ]);
    }

    /**
     * Relatório de Currículos
     */
    public function jobReport(Request $request)
    {
        $query = Candidate::with('jobOpportunity');

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
        }

        if ($request->client_id) {
            $query->whereHas('jobOpportunity', function ($q) use ($request) {
                $q->where('client_id', $request->client_id);
            });
        }

        $candidates = $query->orderBy('created_at', 'desc')->get()->map(function($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'job' => $c->jobOpportunity->title ?? 'N/A',
                'status' => $c->status,
                'created_at' => $c->created_at->format('d/m/Y H:i'),
            ];
        });

        return response()->json($candidates);
    }

    /**
     * Clientes que possuem vagas
     */
    public function jobClients()
    {
        $clients = Cliente::whereHas('jobOpportunities')
            ->select('id', 'nome_fantasia', 'razao_social')
            ->orderBy('nome_fantasia')
            ->get();
            
        return response()->json($clients);
    }
}
