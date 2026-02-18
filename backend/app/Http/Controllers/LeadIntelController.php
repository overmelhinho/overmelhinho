<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\LeadIntelService;
use Illuminate\Support\Facades\Log;

class LeadIntelController extends Controller
{
    protected LeadIntelService $leadIntelService;

    public function __construct(LeadIntelService $leadIntelService)
    {
        $this->leadIntelService = $leadIntelService;
    }

    public function fetch(Request $request)
    {
        try {
            $query = (string) $request->query('query', '');
            $cnpj  = (string) $request->query('cnpj', '');
            $cidade = (string) $request->query('cidade', '');

            $query = trim($query);
            $cidade = trim($cidade);

            if ($query === '') {
                return response()->json(['error' => 'Parâmetro "query" é obrigatório'], 400);
            }

            // ✅ sanitiza CNPJ (opcional)
            $cnpjDigits = preg_replace('/\D/', '', $cnpj);
            if ($cnpjDigits !== '' && strlen($cnpjDigits) !== 14) {
                return response()->json(['error' => 'CNPJ inválido'], 400);
            }

            $resultado = $this->leadIntelService->buscarDados(
                query: $query,
                cnpj: $cnpjDigits ?: null,
                cidadePreferida: $cidade ?: null
            );

            $dados = isset($resultado['dados']) && is_array($resultado['dados'])
                ? $resultado['dados']
                : (is_array($resultado) ? $resultado : []);

            return response()->json([
                'status' => 'ok',
                'dados' => (object) $dados,
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

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
