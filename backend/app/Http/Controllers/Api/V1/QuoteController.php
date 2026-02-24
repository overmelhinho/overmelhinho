<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Models\Cliente;
use App\Jobs\GenerateAiQuoteResponse;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    /**
     * Lista todos os orçamentos (Admin Global)
     */
    public function index(Request $request)
    {
        $query = Quote::with(['cliente.contatos']);

        // Estatísticas para os KPIs (sempre baseadas no total, ignorando filtros de busca para dar visão macro)
        $stats = [
            'total_pending' => Quote::where('status', 'new')->count(),
            'emergency_pending' => Quote::where('status', 'new')->where('urgency', 'emergencia')->count(),
            'avg_wait_time_mins' => round(Quote::where('status', 'new')->avg(\DB::raw('EXTRACT(EPOCH FROM (NOW() - created_at))/60')) ?? 0),
            'conversion_rate' => Quote::count() > 0 ? round((Quote::where('status', 'replied')->count() / Quote::count()) * 100, 1) : 0
        ];

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('urgency')) {
            $query->where('urgency', $request->urgency);
        }

        $quotes = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'quotes' => $quotes,
            'stats' => $stats
        ]);
    }

    /**
     * Recebe um novo orçamento do site público (Público)
     */
    public function store(Request $request)
    {
        $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
            'customer_name' => 'required|string|max:255',
            'customer_whatsapp' => 'required|string',
            'service_requested' => 'required|string',
            'urgency' => 'required|in:pesquisa,semana,emergencia',
        ]);

        $quote = Quote::create($request->all());

        // Dispara o Job da IA em segundo plano
        GenerateAiQuoteResponse::dispatch($quote);

        return response()->json([
            'message' => 'Solicitação enviada com sucesso!',
            'quote' => $quote
        ], 201);
    }

    /**
     * Retorna a "Fila de Foco" para o Admin do Lojista
     */
    public function indexFocus(Request $request, $id)
    {
        // Garante que o cliente existe
        $cliente = Cliente::findOrFail($id);

        $quotes = Quote::where('cliente_id', $cliente->id)
            ->where('status', 'new')
            ->orderByRaw("FIELD(urgency, 'emergencia', 'semana', 'pesquisa')")
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($quotes);
    }

    /**
     * Atualiza o status do orçamento após resposta (Admin)
     */
    public function updateStatus(Request $request, $id)
    {
        $quote = Quote::findOrFail($id);
        
        $request->validate([
            'status' => 'required|in:replied,closed'
        ]);

        $quote->update(['status' => $request->status]);

        return response()->json($quote);
    }
}
