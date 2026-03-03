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

        $log = \App\Models\SearchLog::create([
            'term' => mb_strtolower($request->term, 'UTF-8'),
            'city' => $request->city ? mb_strtolower($request->city, 'UTF-8') : null,
            'results_count' => $request->results_count ?? 0,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => $request->hasSession() ? $request->session()->getId() : null,
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
            'interaction_type' => 'required|in:page_view,whatsapp_click,waze_click,social_click'
        ]);

        $interaction = \App\Models\ClientInteraction::create([
            'cliente_id' => $request->cliente_id,
            'interaction_type' => $request->interaction_type
        ]);

        // ✅ Rastreamento Server-Side via GA4
        try {
            $cliente = Cliente::with(['segmentos', 'cidadesAtendidas'])->find($request->cliente_id);
            $segment = $cliente->segmentos->first()?->nome ?? 'Outros';
            $city = $cliente->cidadesAtendidas->first()?->nome ?? 'Geral';

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
}
