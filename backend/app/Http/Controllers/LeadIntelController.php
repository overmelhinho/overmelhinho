<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\LeadIntelService;
use Illuminate\Support\Facades\Log;

class LeadIntelController extends Controller
{
    protected $leadIntelService;

    public function __construct(LeadIntelService $leadIntelService)
    {
        $this->leadIntelService = $leadIntelService;
    }

    public function fetch(Request $request)
    {
        try {
            $query = $request->query('query');

            if (!$query) {
                return response()->json(['error' => 'Parâmetro "query" é obrigatório'], 400);
            }

            $dados = $this->leadIntelService->buscarDados($query);

            return response()->json([
                'status' => 'ok',
                'dados' => $dados,
            ]);
        } catch (\Throwable $e) {
            Log::error('[LEAD INTEL] ERRO: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Erro interno'], 500);
        }
    }

    public function diagnostico()
    {
        return response()->json([
            'GOOGLE_PLACES_KEY' => env('GOOGLE_PLACES_KEY'),
            'OPENAI_API_KEY' => env('OPENAI_API_KEY') ? 'OK' : 'NÃO DEFINIDO',
        ]);
    }
}
