<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Invoice;
use App\Models\Plan;
use App\Services\TinyErpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class FinancialController extends Controller
{
    protected $tinyService;

    public function __construct(TinyErpService $tinyService)
    {
        $this->tinyService = $tinyService;
    }

    /**
     * Exportar Relatório Executivo em PDF
     */
    public function exportReport()
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        // 1. MRR (Faturamento Pago no mês atual)
        $monthlyPaidInvoices = Invoice::where('status', 'paid')
            ->whereBetween('due_date', [$startOfMonth, $endOfMonth])
            ->get();
        $mrr = $monthlyPaidInvoices->sum('amount');
        $paidCount = $monthlyPaidInvoices->count();

        // 2. LTV (Faturamento total pago / clientes únicos pagos)
        $totalPaid = Invoice::where('status', 'paid')->sum('amount');
        $uniqueClientsCount = Invoice::where('status', 'paid')->distinct('client_id')->count('client_id');
        $ltv = $uniqueClientsCount > 0 ? ($totalPaid / $uniqueClientsCount) : 0;

        // 3. Churn Rate (Cancelados nos últimos 30 dias)
        $last30Days = $now->copy()->subDays(30);
        $totalPeriod = Invoice::whereBetween('created_at', [$last30Days, $now])->count();
        $canceledPeriod = Invoice::where('status', 'canceled')
            ->whereBetween('updated_at', [$last30Days, $now])
            ->count();
        $churn = $totalPeriod > 0 ? ($canceledPeriod / $totalPeriod) * 100 : 0;

        // 4. Inadimplência (Pendentes vencidos)
        $overdueList = Invoice::where('status', 'pending')
            ->where('due_date', '<', $now->startOfDay())
            ->with('client')
            ->orderBy('due_date', 'asc')
            ->get();
        $overdueTotal = $overdueList->sum('amount');
        $overdueCount = $overdueList->count();

        // 5. Pendentes (Aguardando futuro)
        $pendingList = Invoice::where('status', 'pending')
            ->where('due_date', '>=', $now->startOfDay())
            ->get();
        $pendingTotal = $pendingList->sum('amount');
        $pendingCount = $pendingList->count();

        // 6. Últimos 15 Recebidos
        $recentPaid = Invoice::where('status', 'paid')
            ->with(['client', 'plan'])
            ->orderBy('updated_at', 'desc')
            ->limit(15)
            ->get();

        $data = [
            'mrr' => $mrr,
            'paidCount' => $paidCount,
            'ltv' => $ltv,
            'churn' => $churn,
            'overdueList' => $overdueList,
            'overdueTotal' => $overdueTotal,
            'overdueCount' => $overdueCount,
            'pendingTotal' => $pendingTotal,
            'pendingCount' => $pendingCount,
            'recentPaid' => $recentPaid,
        ];

        $pdf = Pdf::loadView('reports.financial', $data)
            ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);

        return $pdf->download('Relatorio_Gestao_PRO_' . $now->format('d-m-Y') . '.pdf');
    }

    /**
     * Obter Estatísticas Globais Financeiras
     */
    public function getStats(Request $request)
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        $applyFilters = function($query) use ($request) {
            if ($request->filled('status') && $request->status !== 'all') {
                if ($request->status === 'overdue') {
                    $query->where('status', 'pending')->where('due_date', '<', now()->startOfDay());
                } else {
                    $query->where('status', $request->status);
                }
            }
            if ($request->filled('date_start')) {
                $query->where('due_date', '>=', $request->date_start);
            }
            if ($request->filled('date_end')) {
                $query->where('due_date', '<=', $request->date_end);
            }
            if ($request->filled('q')) {
                $search = $request->q;
                $query->whereHas('client', function($q) use ($search) {
                    $q->where('nome_fantasia', 'ilike', "%{$search}%")
                      ->orWhere('cpf_cnpj', 'like', "%{$search}%");
                });
                if (is_numeric($search)) {
                    $authId = \App\Models\Autorizacao::where('numero', $search)->value('id');
                    if ($authId) {
                        $query->orWhere('group_id', 'autorizacao-' . $authId);
                    }
                }
            }
            return $query;
        };

        // MRR
        $mrrQuery = Invoice::where('status', 'paid');
        if (!$request->filled('date_start') && !$request->filled('date_end')) {
            $mrrQuery->whereBetween('due_date', [$startOfMonth, $endOfMonth]);
        }
        $applyFilters($mrrQuery);
        $mrr = $mrrQuery->sum('amount');
        
        $totalPaidQuery = Invoice::where('status', 'paid');
        $applyFilters($totalPaidQuery);
        $totalPaid = $totalPaidQuery->sum('amount');
        
        $uniqueClientsQuery = Invoice::where('status', 'paid');
        $applyFilters($uniqueClientsQuery);
        $uniqueClientsCount = $uniqueClientsQuery->distinct('client_id')->count('client_id');
        
        $ltv = $uniqueClientsCount > 0 ? ($totalPaid / $uniqueClientsCount) : 0;

        $last30Days = $now->copy()->subDays(30);
        $totalPeriod = Invoice::whereBetween('created_at', [$last30Days, $now])->count();
        $canceledPeriod = Invoice::where('status', 'canceled')
            ->whereBetween('updated_at', [$last30Days, $now])
            ->count();
        $churn = $totalPeriod > 0 ? ($canceledPeriod / $totalPeriod) * 100 : 0;

        $overdueQuery = Invoice::where('status', 'pending')
            ->where('due_date', '<', $now->startOfDay());
        $applyFilters($overdueQuery);
        $overdueTotal = $overdueQuery->sum('amount');
        $overdueCount = $overdueQuery->count();

        $pendingQuery = Invoice::where('status', 'pending');
        $applyFilters($pendingQuery);
        $pendingTotal = $pendingQuery->sum('amount');
        $pendingCount = $pendingQuery->count();
        
        // Calcular evolução últimos 6 meses (chartDataMonthly) - Independente dos filtros de data
        $sixMonthsAgo = $now->copy()->subMonths(5)->startOfMonth();
        $recentPaidInvoicesQuery = Invoice::selectRaw('sum(amount) as total, to_char(due_date, \'MM/YY\') as month')
            ->where('status', 'paid')
            ->where('due_date', '>=', $sixMonthsAgo)
            ->groupByRaw('to_char(due_date, \'MM/YY\'), to_char(due_date, \'YYYY-MM\')')
            ->orderByRaw('to_char(due_date, \'YYYY-MM\') asc');
        
        // Aplicar filtros de pesquisa, mas ignorar datas (pois o grafico já tem escopo próprio)
        if ($request->filled('q') || ($request->filled('status') && $request->status !== 'all')) {
            $recentPaidInvoicesQuery = $applyFilters(Invoice::query()->mergeConstraintsFrom($recentPaidInvoicesQuery));
            // Removemos as wheres de date_start/date_end que o applyFilters adicionou
            $recentPaidInvoicesQuery->getQuery()->wheres = array_filter($recentPaidInvoicesQuery->getQuery()->wheres, function($w) {
                return !in_array($w['column'] ?? '', ['due_date']); // Mantém a where >= sixMonthsAgo, mas na vdd remove tudo de due_date. Isso é arriscado.
            });
            // Melhor: não aplicar applyFilters no chart, ou fazer manual
        }

        // Refazendo para o chart sem zoar
        $recentPaidInvoicesQuery = Invoice::selectRaw('sum(amount) as total, to_char(due_date, \'MM/YY\') as month')
            ->where('status', 'paid')
            ->where('due_date', '>=', $sixMonthsAgo);
            
        if ($request->filled('q')) {
            $search = $request->q;
            $recentPaidInvoicesQuery->whereHas('client', function($q) use ($search) {
                $q->where('nome_fantasia', 'ilike', "%{$search}%")
                  ->orWhere('cpf_cnpj', 'like', "%{$search}%");
            });
            if (is_numeric($search)) {
                $authId = \App\Models\Autorizacao::where('numero', $search)->value('id');
                if ($authId) {
                    $recentPaidInvoicesQuery->orWhere('group_id', 'autorizacao-' . $authId);
                }
            }
        }
        $recentPaidInvoicesQuery->groupByRaw('to_char(due_date, \'MM/YY\'), to_char(due_date, \'YYYY-MM\')')
            ->orderByRaw('to_char(due_date, \'YYYY-MM\') asc');
            
        $recentPaidInvoices = $recentPaidInvoicesQuery->get();

        $chartDataMonthly = $recentPaidInvoices->map(function ($item) {
            return [
                'name' => $item->month,
                'total' => (float) $item->total,
            ];
        });

        // Quarterly data
        $fourQuartersAgo = $now->copy()->subMonths(11)->startOfMonth();
        $quarterlyInvoicesQuery = Invoice::selectRaw('sum(amount) as total, extract(year from due_date) as year, extract(quarter from due_date) as quarter')
            ->where('status', 'paid')
            ->where('due_date', '>=', $fourQuartersAgo);
            
        if ($request->filled('q')) {
            $search = $request->q;
            $quarterlyInvoicesQuery->whereHas('client', function($q) use ($search) {
                $q->where('nome_fantasia', 'ilike', "%{$search}%")
                  ->orWhere('cpf_cnpj', 'like', "%{$search}%");
            });
            if (is_numeric($search)) {
                $authId = \App\Models\Autorizacao::where('numero', $search)->value('id');
                if ($authId) {
                    $quarterlyInvoicesQuery->orWhere('group_id', 'autorizacao-' . $authId);
                }
            }
        }
        
        $quarterlyInvoicesQuery->groupByRaw('extract(year from due_date), extract(quarter from due_date)')
            ->orderByRaw('extract(year from due_date) asc, extract(quarter from due_date) asc');
            
        $quarterlyInvoices = $quarterlyInvoicesQuery->get();

        $chartDataQuarterly = $quarterlyInvoices->map(function ($item) {
            return [
                'name' => 'Q' . $item->quarter . '/' . substr($item->year, -2),
                'total' => (float) $item->total,
            ];
        });

        // Contar todos os clientes ativos
        $activeClientsCount = Cliente::where('status_assinatura', 'ativo')->count();

        return response()->json([
            'mrr' => $mrr,
            'ltv' => $ltv,
            'churn' => $churn,
            'overdueTotal' => $overdueTotal,
            'overdueCount' => $overdueCount,
            'pendingTotal' => $pendingTotal,
            'pendingCount' => $pendingCount,
            'activeClients' => $activeClientsCount,
            'chartDataMonthly' => $chartDataMonthly,
            'chartDataQuarterly' => $chartDataQuarterly
        ]);
    }

    /**
     * Exportar Carnê de Parcelas (PDF Único)
     */
    public function exportCarnet($groupId)
    {
        $invoices = Invoice::where('group_id', $groupId)
            ->with(['client', 'plan'])
            ->orderBy('parcel_number', 'asc')
            ->get();

        if ($invoices->isEmpty()) {
            return response()->json(['message' => 'Lote de cobranças não encontrado.'], 404);
        }

        $client = $invoices->first()->client;
        $totalAmount = $invoices->sum('amount');

        $data = [
            'client' => $client,
            'invoices' => $invoices,
            'totalAmount' => $totalAmount,
            'installmentsCount' => $invoices->count(),
            'generatedAt' => now()->format('d/m/Y H:i'),
        ];

        $pdf = Pdf::loadView('reports.carnet', $data)
            ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);

        return $pdf->download('Carne_O_Vermelhinho_' . $client->id . '_' . now()->format('d-m-Y') . '.pdf');
    }

    /**
     * Exportar Recibo de Pagamento (PDF Único)
     */
    public function exportReceipt($id)
    {
        $invoice = Invoice::with(['client', 'plan'])->findOrFail($id);

        // Buscar número da autorização se existir no group_id
        $authNumero = null;
        if (str_starts_with($invoice->group_id ?? '', 'autorizacao-')) {
            $authId = (int) str_replace('autorizacao-', '', $invoice->group_id);
            $authNumero = \App\Models\Autorizacao::where('id', $authId)->value('numero');
        }

        $generatedAt = \Carbon\Carbon::now()->format('d/m/Y H:i');
        $payableAmount = $invoice->payable_amount ?? $invoice->amount;
        $payableAmount_extenso = $this->valorPorExtenso($payableAmount);

        // Carregar Logo em Base64 para o PDF
        $logoPath = public_path('logo-contract.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoData = base64_encode(file_get_contents($logoPath));
            $logoBase64 = 'data:image/png;base64,' . $logoData;
        }

        $data = [
            'invoice' => $invoice,
            'client' => $invoice->client,
            'authNumero' => $authNumero ? str_pad($authNumero, 5, '0', STR_PAD_LEFT) : null,
            'generatedAt' => $generatedAt,
            'payableAmount_extenso' => $payableAmount_extenso,
            'logoBase64' => $logoBase64
        ];

        $pdf = Pdf::loadView('reports.receipt', $data)
            ->setPaper('a4', 'portrait')
            ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);

        return $pdf->download('Recibo_O_Vermelhinho_' . $invoice->id . '.pdf');
    }

    /**
     * Converte um valor numérico para extenso (Moeda Real)
     */
    private function valorPorExtenso($valor = 0) {
        $singular = array("centavo", "real", "mil", "milhão", "bilhão", "trilhão", "quatrilhão");
        $plural = array("centavos", "reais", "mil", "milhões", "bilhões", "trilhões", "quatrilhões");

        $c = array("", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos");
        $d = array("", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitocenta", "noventa");
        $d10 = array("dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove");
        $u = array("", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove");

        $z = 0;
        $valor = number_format($valor, 2, ".", ".");
        $inteiro = explode(".", $valor);
        for ($i = 0; $i < count($inteiro); $i++) {
            for ($ii = strlen($inteiro[$i]); $ii < 3; $ii++) {
                $inteiro[$i] = "0" . $inteiro[$i];
            }
        }

        $rt = "";
        $fim = count($inteiro) - ($inteiro[count($inteiro) - 1] > 0 ? 1 : 2);
        for ($i = 0; $i < count($inteiro); $i++) {
            $valor = $inteiro[$i];
            $rc = (($valor > 100) && ($valor < 200)) ? "cento" : $c[$valor[0]];
            $rd = ($valor[1] < 2) ? "" : $d[$valor[1]];
            $ru = ($valor > 0) ? (($valor[1] == 1) ? $d10[$valor[2]] : $u[$valor[2]]) : "";

            $r = $rc . (($rc && ($rd || $ru)) ? " e " : "") . $rd . (($rd && $ru) ? " e " : "") . $ru;
            $t = count($inteiro) - 1 - $i;
            $r .= $r ? " " . ($valor > 1 ? $plural[$t] : $singular[$t]) : "";
            if ($valor == "000")
                $z++;
            elseif ($z > 0)
                $z--;
            if (($t == 1) && ($z > 0) && ($inteiro[0] > 0))
                $r .= (($z > 1) ? " de " : "") . $plural[$t];
            if ($r)
                $rt .= ((($i > 0) && ($i <= $fim) && ($inteiro[0] > 0) && ($z < 1)) ? ( ($i < $fim) ? ", " : " e ") : " ") . $r;
        }

        return (($rt) ? $rt : "zero");
    }

    /**
     * Listar planos disponíveis
     */
    public function indexPlans()
    {
        return response()->json(Plan::all());
    }

    /**
     * Listar faturas de um cliente
     */
    public function indexClientInvoices($clientId)
    {
        $invoices = Invoice::where('client_id', $clientId)
            ->with('plan')
            ->orderBy('id', 'desc')
            ->get();

        // Mapear números de autorização via group_id
        $authIds = $invoices->filter(fn($i) => str_starts_with($i->group_id ?? '', 'autorizacao-'))
            ->map(fn($i) => (int) str_replace('autorizacao-', '', $i->group_id))
            ->unique()
            ->toArray();

        $auths = \App\Models\Autorizacao::whereIn('id', $authIds)->pluck('numero', 'id');

        $invoices->each(function($i) use ($auths) {
            if (str_starts_with($i->group_id ?? '', 'autorizacao-')) {
                $id = (int) str_replace('autorizacao-', '', $i->group_id);
                $num = $auths[$id] ?? null;
                $i->autorizacao_numero = $num ? str_pad($num, 5, '0', STR_PAD_LEFT) : null;
            } else {
                $i->autorizacao_numero = null;
            }
        });

        return response()->json($invoices);
    }

    /**
     * Listar TODAS as faturas (Financeiro Geral)
     */
    public function indexAllInvoices(Request $request)
    {
        $query = Invoice::with(['client.contatos', 'plan']);

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'overdue') {
                $query->where('status', 'pending')
                      ->where('due_date', '<', now()->startOfDay());
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('date_start')) {
            $query->where('due_date', '>=', $request->date_start);
        }

        if ($request->filled('date_end')) {
            $query->where('due_date', '<=', $request->date_end);
        }

        if ($request->filled('q')) {
            $search = $request->q;

            static $unaccentExists = null;
            if ($unaccentExists === null) {
                try {
                    \Illuminate\Support\Facades\DB::select("SELECT unaccent('a')");
                    $unaccentExists = true;
                } catch (\Exception $e) {
                    $unaccentExists = false;
                }
            }

            $query->whereHas('client', function($q) use ($search, $unaccentExists) {
                if ($unaccentExists) {
                    $q->whereRaw("unaccent(nome_fantasia) ilike unaccent(?)", ["%{$search}%"])
                      ->orWhere('cpf_cnpj', 'like', "%{$search}%");
                } else {
                    $q->where('nome_fantasia', 'ilike', "%{$search}%")
                      ->orWhere('cpf_cnpj', 'like', "%{$search}%");
                }
            });
            // Also search by autorizacao_numero via group_id
            if (is_numeric($search)) {
                $authId = \App\Models\Autorizacao::where('numero', $search)->value('id');
                if ($authId) {
                    $query->orWhere('group_id', 'autorizacao-' . $authId);
                }
            }
        }

        $invoices = $query->orderBy('due_date', 'asc')
            ->limit(300)
            ->get();

        // Mapear números de autorização via group_id
        $authIds = $invoices->filter(fn($i) => str_starts_with($i->group_id ?? '', 'autorizacao-'))
            ->map(fn($i) => (int) str_replace('autorizacao-', '', $i->group_id))
            ->unique()
            ->toArray();

        $auths = \App\Models\Autorizacao::whereIn('id', $authIds)->pluck('numero', 'id');

        $invoices->each(function($i) use ($auths) {
            if (str_starts_with($i->group_id ?? '', 'autorizacao-')) {
                $id = (int) str_replace('autorizacao-', '', $i->group_id);
                $num = $auths[$id] ?? null;
                $i->autorizacao_numero = $num ? str_pad($num, 5, '0', STR_PAD_LEFT) : null;
            } else {
                $i->autorizacao_numero = null;
            }
        });

        return response()->json($invoices);
    }

    /**
     * Gerar nova cobrança (com suporte a Permuta Total ou Parcial)
     */
    public function storeInvoice(Request $request, $clientId)
    {
        $client = Cliente::findOrFail($clientId);

        $validated = $request->validate([
            'plan_id'              => 'required|exists:plans,id',
            'due_date'             => 'required|date|after_or_equal:today',
            'amount'               => 'nullable|numeric|min:0',
            'installments'         => 'nullable|integer|min:1|max:60',
            'payment_method'       => 'nullable|string|in:boleto,pix,cartao,dinheiro',
            'discount_value'       => 'nullable|numeric|min:0',
            'discount_type'        => 'nullable|string|in:fixed,percent',
            // Permuta
            'is_permuta'           => 'nullable|boolean',
            'permuta_amount'       => 'nullable|numeric|min:0',
            'permuta_description'  => 'required_if:is_permuta,true|nullable|string|max:1000',
        ]);

        $plan         = Plan::find($validated['plan_id']);
        $totalBase    = $validated['amount'] ?? $plan->price;
        $installments = $validated['installments'] ?? 1;
        $paymentMethod = $validated['payment_method'] ?? 'boleto';

        // ── Desconto ────────────────────────────────
        $discount = 0;
        if (!empty($validated['discount_value'])) {
            if (($validated['discount_type'] ?? 'fixed') === 'percent') {
                $discount = ($totalBase * $validated['discount_value']) / 100;
            } else {
                $discount = $validated['discount_value'];
            }
        }
        $finalTotal = max(0, $totalBase - $discount);

        // ── Permuta ──────────────────────────────────
        $isPermuta       = (bool) ($validated['is_permuta'] ?? false);
        $isPermutaString = $isPermuta ? 'true' : 'false';
        $permutaAmount   = $isPermuta ? (float) ($validated['permuta_amount'] ?? 0) : 0;
        $payableAmount   = max(0, $finalTotal - $permutaAmount);
        $permutaDesc     = $validated['permuta_description'] ?? null;

        // ── Parcelamento (Sem Centavos) ──────────────
        // Parcelas 2..N ficam com valor inteiro; a diferença fica na parcela 1.
        $parcelAmount      = floor($payableAmount / $installments);
        $firstParcelAmount = round($payableAmount - ($parcelAmount * ($installments - 1)), 2);

        $groupId       = (string) \Illuminate\Support\Str::uuid();
        $invoicesCreated = [];
        $dueDate       = \Carbon\Carbon::parse($validated['due_date']);

        // ── Permuta 100% (sem cobrança em dinheiro) ─
        if ($isPermuta && $payableAmount == 0) {
            // Cria apenas 1 invoice (permuta total não gera parcelas)
            $invoice = Invoice::create([
                'client_id'           => $client->id,
                'plan_id'             => $plan->id,
                'amount'              => $finalTotal,
                'due_date'            => $dueDate,
                'status'              => 'paid',           // já ativo
                'payment_method'      => 'permuta',
                'parcel_number'       => 1,
                'total_parcels'       => 1,
                'group_id'            => $groupId,
                'is_permuta'          => 'true',
                'permuta_amount'      => $permutaAmount,
                'payable_amount'      => 0,
                'permuta_description' => $permutaDesc,
                'justification'       => "Liquidado por permuta total. " . ($permutaDesc ?? ''),
                'action_date'         => now(),
            ]);

            // Ativa assinatura diretamente
            $client->update(['status_assinatura' => 'ativa']);

            Log::info("Fatura #{$invoice->id} — Permuta 100% confirmada. Cliente #{$client->id} ativado.");

            return response()->json([
                'message'   => 'Permuta total confirmada. Plano ativado imediatamente.',
                'group_id'  => $groupId,
                'count'     => 1,
                'invoices'  => [$invoice],
                'is_permuta_total' => true,
            ], 201);
        }

        // ── Permuta Parcial ou Cobrança Normal ───────
        for ($i = 1; $i <= $installments; $i++) {
            $currentDueDate   = $dueDate->copy()->addMonths($i - 1);
            $currentAmount    = ($i === 1) ? $firstParcelAmount : $parcelAmount;

            $invoice = Invoice::create([
                'client_id'           => $client->id,
                'plan_id'             => $plan->id,
                'amount'              => $finalTotal / $installments, // valor nominal da parcela
                'due_date'            => $currentDueDate,
                'status'              => 'pending',
                'payment_method'      => $paymentMethod,
                'parcel_number'       => $i,
                'total_parcels'       => $installments,
                'group_id'            => $groupId,
                'is_permuta'          => $isPermutaString,
                'permuta_amount'      => $isPermuta ? round($permutaAmount / $installments, 2) : null,
                'payable_amount'      => $currentAmount,
                'permuta_description' => $permutaDesc,
            ]);

            // Só envia ao Tiny se houver valor a cobrar
            if ($currentAmount > 0) {
                try {
                    $tinyData = $this->tinyService->createReceivable($invoice, $currentAmount);
                    $invoice->update([
                        'tiny_account_id' => $tinyData['tiny_account_id'],
                        'payment_url'     => $tinyData['payment_url'],
                    ]);
                } catch (\Exception $e) {
                    Log::error("Erro ao sincronizar parcela $i da fatura {$invoice->id} com Tiny: " . $e->getMessage());
                }
            }

            $invoicesCreated[] = $invoice;
        }

        $label = $isPermuta ? 'Permuta parcial + cobrança gerada com sucesso.' : 'Cobrança(s) gerada(s) e enviada(s) ao Tiny ERP com sucesso.';

        return response()->json([
            'message'          => $label,
            'group_id'         => $groupId,
            'count'            => count($invoicesCreated),
            'invoices'         => $invoicesCreated,
            'is_permuta_total' => false,
        ], 201);
    }

    /**
     * Atualizar status da fatura manualmente (Baixa ou Cancelamento)
     */
    public function updateStatus(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'status'         => 'required|in:paid,canceled,pending',
            'justification'  => 'nullable|string',
            'payment_method' => 'nullable|string|in:pix,dinheiro,cartao,boleto',
        ]);

        $updateData = [
            'status'        => $validated['status'],
            'justification' => $validated['justification'] ?? null,
            'action_date'   => now(),
        ];

        if (!empty($validated['payment_method'])) {
            $updateData['payment_method'] = $validated['payment_method'];
        }

        $invoice->update($updateData);

        // Se marcou como pago, ativa a assinatura do cliente e sincroniza com o Tiny
        if ($validated['status'] === 'paid') {
            $invoice->client->update(['status_assinatura' => 'ativo']);

            // Sincronizar baixa com o Tiny se a fatura tiver um ID lá
            if ($invoice->tiny_account_id) {
                try {
                    $valorPago = (float)($invoice->payable_amount ?? $invoice->amount);

                    // Obter valor original no Tiny para calcular desconto
                    $tinyConta = $this->tinyService->getReceivableStatus($invoice->tiny_account_id);
                    $valorTiny = $tinyConta ? (float)($tinyConta['valor'] ?? 0) : $valorPago;
                    $desconto  = max(0, round($valorTiny - $valorPago, 2));

                    $this->tinyService->payReceivable($invoice->tiny_account_id, $valorPago, $desconto);

                    if ($desconto > 0) {
                        Log::info("Baixa da fatura #{$invoice->id} no Tiny: R$ {$valorPago} pago + R$ {$desconto} desconto (original Tiny: R$ {$valorTiny}).");
                    } else {
                        Log::info("Baixa da fatura #{$invoice->id} sincronizada com sucesso no Tiny ERP (Valor: R$ {$valorPago}).");
                    }
                }
                catch (\Exception $e) {
                    Log::error("Erro ao sincronizar baixa da fatura #{$invoice->id} no Tiny: " . $e->getMessage());
                }
            }
        }

        Log::info("Fatura #{$invoice->id} atualizada manualmente para {$validated['status']} por usuário autenticado. Justificativa: {$validated['justification']}");

        return response()->json([
            'message' => 'Fatura atualizada com sucesso e sincronizada com o Tiny.',
            'invoice' => $invoice->load(['client', 'plan']),
        ]);
    }

    /**
     * Alterar o valor ou vencimento da fatura.
     *
     * difference_action:
     *   discount      → diferença é descartada (desconto/remissão)
     *   redistribute  → diferença redistribuída nas parcelas pendentes do grupo
     *   create_extra  → cria nova fatura com o valor da diferença
     */
    public function updateInvoice(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        if ($invoice->status !== 'pending') {
            return response()->json(['message' => 'Apenas faturas pendentes podem ser alteradas.'], 400);
        }

        $validated = $request->validate([
            'amount'            => 'required|numeric|min:0',
            'due_date'          => 'required|date',
            'justification'     => 'required|string|min:5',
            'difference_action' => 'nullable|string|in:discount,redistribute,create_extra,next_installment',
            'extra_due_date'    => 'required_if:difference_action,create_extra|nullable|date',
        ]);

        $oldAmount         = (float) ($invoice->payable_amount ?? $invoice->amount);
        $newAmount         = (float) $validated['amount'];
        $difference        = round($oldAmount - $newAmount, 2);
        $differenceAction  = $validated['difference_action'] ?? 'discount';
        $justification     = $validated['justification'];
        $tinyErrors        = [];
        $extraInvoice      = null;
        $redistributedInfo = null;

        // ── 1. Atualiza a parcela principal ─────────────────────────
        $invoice->update([
            'amount'        => $newAmount,
            'payable_amount'=> $newAmount,
            'due_date'      => $validated['due_date'],
            'justification' => "Alterado de R$ {$oldAmount} para R$ {$newAmount} (venc {$validated['due_date']}). Ação diferença: {$differenceAction}. Motivo: {$justification}",
        ]);

        // Sync Tiny – Criar nova conta para garantir boleto com valor correto
        if ($invoice->tiny_account_id) {
            try {
                $invoice->load(['client.enderecos', 'client.contatos', 'plan']);
                $tinyData = $this->tinyService->updateReceivable($invoice, $newAmount, $validated['due_date']);
                
                // Atualizamos localmente com o novo link/ID do Tiny
                $invoice->update([
                    'tiny_account_id' => $tinyData['tiny_account_id'],
                    'payment_url'     => $tinyData['payment_url'],
                ]);
                
                Log::info("Fatura #{$invoice->id} recriada no Tiny ERP (Boleto Atualizado). Novo ID: {$tinyData['tiny_account_id']}");
            } catch (\Exception $e) {
                $tinyErrors[] = "Erro ao atualizar boleto: " . $e->getMessage();
                Log::error("Erro ao sincronizar edição da fatura #{$invoice->id} no Tiny: " . $e->getMessage());
            }
        }

        // ── 2. Aplicar ação sobre a diferença (somente se houver diferença) ──
        if ($difference != 0 && abs($difference) >= 0.01) {

            if ($differenceAction === 'redistribute' && $invoice->group_id) {
                // Busca as outras parcelas pendentes do grupo (exceto esta)
                $siblings = Invoice::where('group_id', $invoice->group_id)
                    ->where('status', 'pending')
                    ->where('id', '!=', $invoice->id)
                    ->orderBy('parcel_number')
                    ->get();

                if ($siblings->isNotEmpty()) {
                    $addPerParcel   = floor(($difference / $siblings->count()) * 100) / 100;
                    $remainderCents = round($difference - ($addPerParcel * $siblings->count()), 2);

                    foreach ($siblings as $idx => $sibling) {
                        // O primeiro irmão absorve a sobra de centavos
                        $adjustment   = $addPerParcel + ($idx === 0 ? $remainderCents : 0);
                        $sibNewAmount = round(($sibling->payable_amount ?? $sibling->amount) + $adjustment, 2);
                        $sibNewAmount = max(0, $sibNewAmount);

                        // Data formatada de forma segura
                        $sibDueDate = \Carbon\Carbon::parse($sibling->due_date)->format('Y-m-d');

                        $sibling->update([
                            'amount'          => $sibNewAmount,
                            'payable_amount'  => $sibNewAmount,
                            'justification'   => "Valor redistribuído da parcela #{$invoice->parcel_number} (diff R$ {$adjustment}). Motivo: {$justification}",
                        ]);

                        // Sync Tiny para redistribuição
                        if ($sibling->tiny_account_id) {
                            try {
                                $sibling->load(['client.enderecos', 'client.contatos', 'plan']);
                                $tinyData = $this->tinyService->updateReceivable($sibling, $sibNewAmount, $sibDueDate);
                                $sibling->update([
                                    'tiny_account_id' => $tinyData['tiny_account_id'],
                                    'payment_url'     => $tinyData['payment_url'],
                                ]);
                                Log::info("[Redistribute] Tiny sync OK: parcela #{$sibling->parcel_number} novo boleto gerado.");
                            } catch (\Exception $e) {
                                $tinyErrors[] = "Erro ao atualizar boleto da parcela #{$sibling->parcel_number}: " . $e->getMessage();
                                Log::error("[Redistribute] Tiny sync FALHOU: parcela #{$sibling->parcel_number}: " . $e->getMessage());
                            }
                        }
                    }

                    $redistributedInfo = [
                        'siblings_updated' => $siblings->count(),
                        'add_per_parcel'   => $addPerParcel,
                    ];
                }

            } elseif ($differenceAction === 'next_installment' && $invoice->group_id) {
                // Busca EXATAMENTE a próxima parcela pendente
                $nextSibling = Invoice::where('group_id', $invoice->group_id)
                    ->where('status', 'pending')
                    ->where('parcel_number', '>', $invoice->parcel_number)
                    ->orderBy('parcel_number', 'asc')
                    ->first();

                if ($nextSibling) {
                    $sibNewAmount = round(($nextSibling->payable_amount ?? $nextSibling->amount) + $difference, 2);
                    $sibNewAmount = max(0, $sibNewAmount);

                    $nextSibling->update([
                        'amount'         => $sibNewAmount,
                        'payable_amount' => $sibNewAmount,
                        'justification'  => "Diferença recebida da parcela #{$invoice->parcel_number} (R$ {$difference}). Motivo: {$justification}",
                    ]);

                    // Sync Tiny para a próxima parcela
                    if ($nextSibling->tiny_account_id) {
                        try {
                            $nextSibling->load(['client.enderecos', 'client.contatos', 'plan']);
                            $tinyData = $this->tinyService->updateReceivable($nextSibling, $sibNewAmount, $nextSibling->due_date);
                            $nextSibling->update([
                                'tiny_account_id' => $tinyData['tiny_account_id'],
                                'payment_url'     => $tinyData['payment_url'],
                            ]);
                        } catch (\Exception $e) {
                            $tinyErrors[] = "Erro ao atualizar boleto da próxima parcela (#{$nextSibling->parcel_number}): " . $e->getMessage();
                        }
                    }

                    $redistributedInfo = [
                        'next_parcel_number' => $nextSibling->parcel_number,
                        'adjustment'         => $difference,
                    ];
                }

            } elseif ($differenceAction === 'create_extra' && $difference > 0) {
                // Cria nova fatura com o valor da diferença
                $extraDueDate = \Carbon\Carbon::parse($validated['extra_due_date']);
                $maxParcel    = Invoice::where('group_id', $invoice->group_id ?? '')->max('parcel_number') ?? $invoice->parcel_number;

                $extraInvoice = Invoice::create([
                    'client_id'      => $invoice->client_id,
                    'plan_id'        => $invoice->plan_id,
                    'amount'         => $difference,
                    'payable_amount' => $difference,
                    'due_date'       => $extraDueDate,
                    'status'         => 'pending',
                    'payment_method' => $invoice->payment_method,
                    'parcel_number'  => $maxParcel + 1,
                    'total_parcels'  => ($invoice->total_parcels ?? 1) + 1,
                    'group_id'       => $invoice->group_id,
                    'justification'  => "Parcela extra criada pela diferença da edição da parcela #{$invoice->parcel_number}. Motivo: {$justification}",
                ]);

                // Sync Tiny – criar nova conta a receber
                try {
                    $tinyData = $this->tinyService->createReceivable($extraInvoice, $difference);
                    $extraInvoice->update([
                        'tiny_account_id' => $tinyData['tiny_account_id'],
                        'payment_url'     => $tinyData['payment_url'],
                    ]);
                } catch (\Exception $e) {
                    $tinyErrors[] = "Parcela extra: " . $e->getMessage();
                    Log::error("Erro ao criar parcela extra no Tiny: " . $e->getMessage());
                }
            }
            // discount: nenhuma ação adicional necessária
        }

        $message = match($differenceAction) {
            'redistribute' => 'Fatura alterada. Diferença de R$ ' . number_format(abs($difference), 2, ',', '.') . ' redistribuída nas demais parcelas.',
            'create_extra' => 'Fatura alterada. Nova parcela extra de R$ ' . number_format(abs($difference), 2, ',', '.') . ' criada.',
            'next_installment' => 'Fatura alterada. Diferença de R$ ' . number_format(abs($difference), 2, ',', '.') . ' ajustada na próxima parcela.',
            default        => 'Fatura alterada. Diferença de R$ ' . number_format(abs($difference), 2, ',', '.') . ' registrada como desconto.',
        };

        return response()->json([
            'message'            => $message,
            'invoice'            => $invoice->load(['client', 'plan']),
            'extra_invoice'      => $extraInvoice,
            'redistributed_info' => $redistributedInfo,
            'tiny_errors'        => $tinyErrors,
        ]);
    }

    /**
     * Quitação antecipada de um grupo de parcelas (com desconto opcional).
     * Liquida todas as parcelas pendentes do group_id e sincroniza no Tiny.
     */
    public function settleGroup(Request $request)
    {
        $validated = $request->validate([
            'group_id'       => 'required|string',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_type'  => 'nullable|string|in:fixed,percent',
            'payment_method' => 'nullable|string|in:pix,dinheiro,cartao,boleto',
            'justification'  => 'required|string|min:5',
        ]);

        $pendingInvoices = Invoice::where('group_id', $validated['group_id'])
            ->where('status', 'pending')
            ->get();

        if ($pendingInvoices->isEmpty()) {
            return response()->json(['message' => 'Nenhuma parcela pendente encontrada para este grupo.'], 404);
        }

        $totalPendente = $pendingInvoices->sum(fn($i) => $i->payable_amount ?? $i->amount);

        // Calcular desconto
        $discount = 0;
        if (!empty($validated['discount_value'])) {
            if (($validated['discount_type'] ?? 'fixed') === 'percent') {
                $discount = ($totalPendente * $validated['discount_value']) / 100;
            } else {
                $discount = $validated['discount_value'];
            }
        }
        $totalAPagar = max(0, $totalPendente - $discount);

        $settled = 0;
        $tinyErrors = [];

        foreach ($pendingInvoices as $invoice) {
            $invoice->update([
                'status'         => 'paid',
                'payment_method' => $validated['payment_method'] ?? $invoice->payment_method,
                'justification'  => "Quitação antecipada. Total do grupo: R$ {$totalPendente}, desconto: R$ {$discount}. Motivo: {$validated['justification']}",
                'action_date'    => now(),
            ]);

            if ($invoice->tiny_account_id) {
                try {
                    $valorPago = (float)($invoice->payable_amount ?? $invoice->amount);

                    // Obter valor original no Tiny para calcular desconto automático
                    $tinyConta = $this->tinyService->getReceivableStatus($invoice->tiny_account_id);
                    $valorTiny = $tinyConta ? (float)($tinyConta['valor'] ?? 0) : $valorPago;
                    $descontoTiny = max(0, round($valorTiny - $valorPago, 2));

                    $this->tinyService->payReceivable($invoice->tiny_account_id, $valorPago, $descontoTiny);
                } catch (\Exception $e) {
                    $tinyErrors[] = "Parcela #{$invoice->parcel_number}: " . $e->getMessage();
                    Log::error("[settleGroup] Erro ao baixar parcela {$invoice->id} no Tiny: " . $e->getMessage());
                }
            }
            $settled++;
        }

        // Ativa a assinatura do cliente
        $pendingInvoices->first()->client?->update(['status_assinatura' => 'ativa']);

        return response()->json([
            'message'     => "{$settled} parcela(s) quitada(s) com sucesso!",
            'total_pago'  => $totalAPagar,
            'desconto'    => $discount,
            'tiny_errors' => $tinyErrors,
        ]);
    }

    /**
     * Baixa em lote de faturas selecionadas
     */
    public function settleBatch(Request $request)
    {
        $validated = $request->validate([
            'ids'            => 'required|array',
            'ids.*'          => 'exists:invoices,id',
            'payment_method' => 'nullable|string|in:pix,dinheiro,cartao,boleto',
            'justification'  => 'nullable|string',
        ]);

        $invoices = Invoice::whereIn('id', $validated['ids'])
            ->where('status', 'pending')
            ->get();

        if ($invoices->isEmpty()) {
            return response()->json(['message' => 'Nenhuma fatura pendente encontrada para processar.'], 404);
        }

        $settledCount = 0;
        $tinyErrors = [];

        foreach ($invoices as $invoice) {
            $invoice->update([
                'status'         => 'paid',
                'payment_method' => $validated['payment_method'] ?? $invoice->payment_method ?? 'pix',
                'justification'  => $validated['justification'] ?? 'Baixa em lote realizada pelo administrativo.',
                'action_date'    => now(),
            ]);

            if ($invoice->tiny_account_id) {
                try {
                    $valorPago = (float)($invoice->payable_amount ?? $invoice->amount);
                    $this->tinyService->payReceivable($invoice->tiny_account_id, $valorPago, 0);
                } catch (\Exception $e) {
                    $tinyErrors[] = "Fatura #{$invoice->id}: " . $e->getMessage();
                    Log::error("[settleBatch] Erro ao baixar parcela {$invoice->id} no Tiny: " . $e->getMessage());
                }
            }
            $settledCount++;
        }

        // Tenta ativar o cliente se houver pelo menos um
        if ($invoices->first()) {
            $invoices->first()->client->update(['status_assinatura' => 'ativo']);
        }

        return response()->json([
            'message'     => "{$settledCount} fatura(s) baixada(s) com sucesso.",
            'tiny_errors' => $tinyErrors,
        ]);
    }

    /**
     * Download em lote de recibos (ZIP)
     */
    public function downloadReceiptsBatch(Request $request)
    {
        $ids = $request->input('ids');
        if (!$ids || !is_array($ids)) {
            return response()->json(['message' => 'Nenhuma fatura selecionada.'], 422);
        }

        $invoices = Invoice::with(['client', 'plan'])
            ->whereIn('id', $ids)
            ->get();

        if ($invoices->isEmpty()) {
            return response()->json(['message' => 'Faturas não encontradas.'], 404);
        }

        $tempDir = storage_path('app/public/temp/' . now()->format('YmdHis') . '_' . uniqid());
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        // Carregar Logo em Base64 para o PDF
        $logoPath = public_path('logo-contract.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoData = base64_encode(file_get_contents($logoPath));
            $logoBase64 = 'data:image/png;base64,' . $logoData;
        }

        $pdfFiles = [];
        foreach ($invoices as $invoice) {
            // Buscar número da autorização se existir no group_id
            $authNumero = null;
            if (str_starts_with($invoice->group_id ?? '', 'autorizacao-')) {
                $authId = (int) str_replace('autorizacao-', '', $invoice->group_id);
                $authNumero = \App\Models\Autorizacao::where('id', $authId)->value('numero');
            }

            $generatedAt = \Carbon\Carbon::now()->format('d/m/Y H:i');
            $payableAmount = $invoice->payable_amount ?? $invoice->amount;
            $payableAmount_extenso = $this->valorPorExtenso($payableAmount);

            $data = [
                'invoice' => $invoice,
                'client' => $invoice->client,
                'authNumero' => $authNumero ? str_pad($authNumero, 5, '0', STR_PAD_LEFT) : null,
                'generatedAt' => $generatedAt,
                'payableAmount_extenso' => $payableAmount_extenso,
                'logoBase64' => $logoBase64
            ];

            $pdf = Pdf::loadView('reports.receipt', $data)
                ->setPaper('a4', 'portrait')
                ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'defaultFont' => 'sans-serif']);
            
            $filename = "recibo_" . str_pad($invoice->id, 5, '0', STR_PAD_LEFT) . ".pdf";
            $fullPath = $tempDir . DIRECTORY_SEPARATOR . $filename;
            file_put_contents($fullPath, $pdf->output());
            $pdfFiles[] = $fullPath;
        }

        $zipName = 'recibos_' . now()->format('YmdHis') . '.zip';
        $zipPath = storage_path('app/public/temp/' . $zipName);

        if (class_exists('\ZipArchive')) {
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
                foreach ($pdfFiles as $path) {
                    $zip->addFile($path, basename($path));
                }
                $zip->close();
            }
        } else {
            // Fallback para Windows usando PowerShell
            $quotedFiles = array_map(fn($f) => "'$f'", $pdfFiles);
            $filesList = implode(',', $quotedFiles);
            $cmd = "powershell -Command \"Compress-Archive -Path $filesList -DestinationPath '$zipPath' -Force\"";
            exec($cmd, $output, $returnCode);
        }

        // Limpa os arquivos individuais
        foreach ($pdfFiles as $f) { @unlink($f); }
        @rmdir($tempDir);

        if (!file_exists($zipPath)) {
            return response()->json(['message' => 'Arquivo ZIP não foi gerado.'], 500);
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    /**
     * Sincroniza as faturas pendentes com o Tiny ERP (assíncrono)
     */
    public function syncInvoices()
    {
        // Busca IDs das faturas pendentes com tiny_account_id
        $invoiceIds = Invoice::where('status', 'pending')
            ->whereNotNull('tiny_account_id')
            ->pluck('id')
            ->toArray();

        $semTinyCount = Invoice::where('status', 'pending')
            ->whereNull('tiny_account_id')
            ->count();

        if (empty($invoiceIds)) {
            return response()->json([
                'message' => 'Nenhuma fatura pendente com ID do Tiny foi encontrada.',
                'updated_count' => 0,
                'total_verificadas' => 0,
                'sem_tiny_id' => $semTinyCount,
            ]);
        }

        // Despacha o Job para verificar o status no Tiny em background (com sleep)
        \App\Jobs\CheckTinyInvoicesStatusJob::dispatch($invoiceIds);

        return response()->json([
            'message' => 'Verificação iniciada em background! Isso pode levar alguns minutos.',
            'total_verificadas' => count($invoiceIds),
            'sem_tiny_id' => $semTinyCount,
        ]);
    }

    /**
     * Reenvia ao Tiny todas as faturas pendentes que ainda não possuem tiny_account_id
     */
    public function resendToTiny(Request $request)
    {
        $query = Invoice::whereNull('tiny_account_id');

        if ($request->has('ids') && is_array($request->ids) && count($request->ids) > 0) {
            $query->whereIn('id', $request->ids);
        } else {
            $query->where('status', 'pending');
        }

        $invoiceIds = $query->pluck('id')->toArray();

        if (empty($invoiceIds)) {
            return response()->json([
                'enviadas' => 0,
                'erros' => 0,
                'total' => 0,
                'message' => 'Nenhuma fatura pendente de envio encontrada.'
            ]);
        }

        \App\Jobs\SyncInvoicesToTinyJob::dispatch($invoiceIds);

        return response()->json([
            'enviadas' => 0,
            'erros' => 0,
            'total' => count($invoiceIds),
            'message' => 'Sincronização iniciada em background com sucesso.'
        ]);
    }

    /**
     * Webhook do Tiny ERP (Olist)
     * Recebe notificações de faturamento e baixa de contas.
     */
    public function handleWebhook(Request $request)
    {
        // 1. Logar TUDO para debug - Essencial para entender o que o Tiny está enviando
        Log::info('Tiny Webhook Event Received', [
            'headers' => $request->headers->all(),
            'body' => $request->all(),
            'query' => $request->query->all()
        ]);

        // 2. Extrair dados (O Tiny pode enviar direto no root ou em um array 'contas'/'registros')
        $tinyAccountId = $request->input('id') ?? $request->input('contas.0.id') ?? $request->input('registros.0.id');
        $situacao = $request->input('situacao') ?? $request->input('contas.0.situacao') ?? $request->input('registros.0.situacao');

        if (!$tinyAccountId) {
            Log::warning('Tiny Webhook: ID da conta não identificado no payload.', $request->all());
            return response()->json(['message' => 'ID não identificado'], 400);
        }

        // 3. Buscar a fatura local
        $invoice = Invoice::where('tiny_account_id', (string)$tinyAccountId)->first();

        if (!$invoice) {
            Log::warning("Tiny Webhook: Fatura não encontrada para tiny_account_id: {$tinyAccountId}");
            return response()->json(['message' => 'Fatura local não encontrada'], 404);
        }

        // 4. Verificar se a situação é "Pago/Recebido"
        // No Tiny ERP: 1 = Aberto, 2 = Recebido/Pago, 3 = Cancelado
        $isPaid = ($situacao == 2 || strtolower($situacao) == 'pago' || strtolower($situacao) == 'recebido' || $request->input('status') === 'paid');
        $isCanceled = ($situacao == 3 || strtolower($situacao) == 'cancelado' || $request->input('status') === 'canceled');

        if ($isPaid) {
            $invoice->update([
                'status' => 'paid',
                'justification' => 'Baixa automática via Tiny ERP Webhook',
                'action_date' => now()
            ]);

            // Ativar assinatura do cliente
            if ($invoice->client) {
                $invoice->client->update(['status_assinatura' => 'ativo']);
                Log::info("Cliente #{$invoice->client->id} ativado via Webhook Tiny.");
            }

            Log::info("Fatura #{$invoice->id} marcada como PAGA via Webhook Tiny.");
        }
        elseif ($isCanceled) {
            $invoice->update([
                'status' => 'canceled',
                'justification' => 'Cancelamento via Tiny ERP Webhook',
                'action_date' => now()
            ]);
            Log::info("Fatura #{$invoice->id} marcada como CANCELADA via Webhook Tiny.");
        }

        return response()->json(['status' => 'success', 'processed_id' => $tinyAccountId]);
    }
}
