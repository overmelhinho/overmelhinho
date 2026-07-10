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

        // Filtro de Data
        if ($request->has('period')) {
            switch ($request->period) {
                case '24h':
                    $query->where('created_at', '>=', now()->subDay());
                    break;
                case '7d':
                    $query->where('created_at', '>=', now()->subDays(7));
                    break;
                case '30d':
                    $query->where('created_at', '>=', now()->subDays(30));
                    break;
            }
        } elseif ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
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
        // Honeypot check: se o campo invisível estiver preenchido, é um bot de spam.
        // Retornamos 200 OK falso para despistar o robô sem salvar nada.
        if ($request->filled('email_confirmation')) {
            return response()->json([
                'message' => 'Solicitação enviada com sucesso!'
            ], 200);
        }

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

    /**
     * Gera mensagem de prospecção via IA para clientes gratuitos
     */
    public function generateProspectMessage(Request $request, $id, \App\Services\AiQuoteService $aiService)
    {
        $quote = Quote::with('cliente')->findOrFail($id);
        
        $message = $aiService->generateProspectingMessage($quote);
        
        if (!$message) {
            return response()->json([
                'message' => 'Não foi possível gerar a mensagem de prospecção no momento. Tente novamente.'
            ], 500);
        }

        return response()->json([
            'message' => $message
        ]);
    }
}
