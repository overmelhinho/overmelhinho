<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
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

        return response()->json([
            'message' => 'Interação registrada com sucesso',
            'data' => $interaction
        ], 201);
    }
}
