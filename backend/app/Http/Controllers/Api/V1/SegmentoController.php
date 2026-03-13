<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Segmento;

class SegmentoController extends Controller
{
    public function index(Request $request)
    {
        $query = Segmento::select('id', 'nome')->orderBy('nome');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('nome', 'LIKE', "%{$search}%");
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nome' => 'required|string|max:255|unique:segmentos,nome',
        ]);

        $segmento = Segmento::create([
            'nome' => $request->nome,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $segmento
        ], 201);
    }
}
