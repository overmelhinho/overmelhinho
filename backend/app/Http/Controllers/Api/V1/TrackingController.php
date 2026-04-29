<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Ga4MeasurementProtocolService;
use App\Models\Cliente;

class TrackingController extends Controller
{
    protected $ga4;

    public function __construct(Ga4MeasurementProtocolService $ga4)
    {
        $this->ga4 = $ga4;
    }

    public function search(Request $request)
    {
        $request->validate([
            'term' => 'required|string|max:255',
            'city' => 'nullable|string|max:255',
            'results_count' => 'nullable|integer',
        ]);

        $term = mb_strtolower($request->term, 'UTF-8');
        $resultsCount = (int) ($request->results_count ?? 0);
        $ipAddress = $request->ip();
        $sessionId = $request->hasSession() ? $request->session()->getId() : null;

        // ✅ Lógica de Aprendizado: Detecta se o usuário corrigiu a busca após um erro (0 resultados)
        if ($resultsCount > 0) {
            try {
                $lastFailed = \App\Models\SearchLog::where(function($q) use ($ipAddress, $sessionId) {
                        if ($sessionId) $q->where('session_id', $sessionId);
                        else $q->where('ip_address', $ipAddress);
                    })
                    ->where('results_count', 0)
                    ->where('term', '!=', $term)
                    ->where('created_at', '>=', now()->subMinutes(2))
                    ->orderByDesc('created_at')
                    ->first();

                if ($lastFailed) {
                    $dist = levenshtein($lastFailed->term, $term);
                    // Se a distância for pequena (máximo 3 caracteres de diferença), consideramos correção
                    if ($dist >= 1 && $dist <= 3) {
                        \App\Models\SearchCorrection::updateOrCreate(
                            ['typo' => $lastFailed->term, 'correction' => $term],
                            ['hit_count' => \Illuminate\Support\Facades\DB::raw('hit_count + 1')]
                        );
                    }
                }
            } catch (\Exception $e) {
                \Log::warning('Erro no aprendizado de busca: ' . $e->getMessage());
            }
        }

        $log = \App\Models\SearchLog::create([
            'term' => $term,
            'city' => $request->city ? mb_strtolower($request->city, 'UTF-8') : null,
            'results_count' => $resultsCount,
            'ip_address' => $ipAddress,
            'user_agent' => $request->userAgent(),
            'session_id' => $sessionId,
        ]);

        return response()->json([
            'message' => 'Busca registrada',
            'data' => $log
        ], 201);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
            'interaction_type' => 'required|in:page_view,whatsapp_click,waze_click,social_click,call_click,share_click',
            'city' => 'nullable|string|max:255'
        ]);

        $interaction = \App\Models\ClientInteraction::create([
            'cliente_id' => $request->cliente_id,
            'interaction_type' => $request->interaction_type,
            // 'city' => $request->city, // TODO: Adicionar coluna no DB se necessário
        ]);

        // ✅ Rastreamento Server-Side via GA4
        try {
            $cliente = Cliente::with(['segmentos', 'cidadesAtendidas'])->find($request->cliente_id);
            $segment = $cliente->segmentos->first()?->nome ?? 'Outros';
            
            // Prioriza a cidade vinda do request (Contexto de Landing Page)
            $city = $request->city ?: ($cliente->cidadesAtendidas->first()?->nome ?? 'Geral');

            $this->ga4->sendInteractionEvent(
                $request->cliente_id,
                $segment,
                $city,
                $request->interaction_type
            );
        } catch (\Exception $e) {
            \Log::error('Falha ao processar GA4 Server-Side: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Interação registrada com sucesso',
            'data' => $interaction
        ], 201);
    }

    public function adInteraction(Request $request)
    {
        $request->validate([
            'campanha_id' => 'required',
            'type' => 'required|in:view,click',
            'placement' => 'nullable|string',
        ]);

        // Salva no banco local
        $log = \Illuminate\Support\Facades\DB::table('campanha_interacoes')->insert([
            'campanha_id' => $request->campanha_id,
            'cliente_id' => $request->cliente_id,
            'type' => $request->type,
            'placement' => $request->placement,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        // Envia para o GA4
        try {
            // Busca dados da campanha para o GA
            $camp = \Illuminate\Support\Facades\DB::table('campanhas as c')
                ->leftJoin('clientes as cli', 'c.cliente_id', '=', 'cli.id')
                ->where('c.id', $request->campanha_id)
                ->first(['c.nome', 'cli.nome_fantasia']);

            $this->ga4->sendAdEvent(
                $request->campanha_id,
                $camp->nome ?? 'Campanha #' . $request->campanha_id,
                $request->placement ?? 'general',
                $request->type,
                $request->cliente_id,
                $camp->nome_fantasia ?? null
            );
        } catch (\Exception $e) {
            \Log::error('Erro ao processar GA4 para anúncios: ' . $e->getMessage());
        }

        return response()->json(['message' => 'OK'], 201);
    }
}
