<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Contato;
use App\Http\Requests\ContatoRequest;
use App\Http\Resources\ContatoResource;
use Illuminate\Http\Request;

class ContatoController extends Controller
{
    public function index($clienteId)
    {
        $contatos = Contato::where('cliente_id', $clienteId)->get();
        return ContatoResource::collection($contatos);
    }

    public function store(ContatoRequest $request, $clienteId)
    {
        $cliente = Cliente::findOrFail($clienteId);
        $contato = $cliente->contatos()->create($request->validated());
        return new ContatoResource($contato);
    }

    public function show($clienteId, $contatoId)
    {
        $contato = Contato::where('cliente_id', $clienteId)->findOrFail($contatoId);
        return new ContatoResource($contato);
    }

    public function update(ContatoRequest $request, $clienteId, $contatoId)
    {
        $contato = Contato::where('cliente_id', $clienteId)->findOrFail($contatoId);
        $contato->update($request->validated());
        return new ContatoResource($contato);
    }

    public function destroy($clienteId, $contatoId)
    {
        $contato = Contato::where('cliente_id', $clienteId)->findOrFail($contatoId);
        $contato->delete();
        return response()->json(['success' => true]);
    }
}
