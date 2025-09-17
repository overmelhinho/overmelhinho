<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Endereco;
use App\Http\Requests\EnderecoRequest;
use App\Http\Resources\EnderecoResource;
use Illuminate\Http\Request;

class EnderecoController extends Controller
{
    public function index($clienteId)
    {
        $enderecos = Endereco::where('cliente_id', $clienteId)->get();
        return EnderecoResource::collection($enderecos);
    }

    public function store(EnderecoRequest $request, $clienteId)
    {
        $cliente = Cliente::findOrFail($clienteId);
        $endereco = $cliente->enderecos()->create($request->validated());
        return new EnderecoResource($endereco);
    }

    public function show($clienteId, $enderecoId)
    {
        $endereco = Endereco::where('cliente_id', $clienteId)->findOrFail($enderecoId);
        return new EnderecoResource($endereco);
    }

    public function update(EnderecoRequest $request, $clienteId, $enderecoId)
    {
        $endereco = Endereco::where('cliente_id', $clienteId)->findOrFail($enderecoId);
        $endereco->update($request->validated());
        return new EnderecoResource($endereco);
    }

    public function destroy($clienteId, $enderecoId)
    {
        $endereco = Endereco::where('cliente_id', $clienteId)->findOrFail($enderecoId);
        $endereco->delete();
        return response()->json(['success' => true]);
    }
}
