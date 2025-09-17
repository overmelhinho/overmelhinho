<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Http\Requests\ClienteRequest;
use App\Http\Resources\ClienteResource;
use Illuminate\Http\Request;
use App\Http\Resources\HistoricoAlteracaoResource;
use App\Models\HistoricoAlteracao;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $clientes = Cliente::with(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'galeriaImagens'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return ClienteResource::collection($clientes);
    }

    public function show($id)
    {
        $cliente = Cliente::with(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'galeriaImagens'])
            ->findOrFail($id);

        return new ClienteResource($cliente);
    }

    public function store(ClienteRequest $request)
    {
        $cliente = Cliente::create($request->validated());

        if ($request->has('segmentos')) {
            $cliente->segmentos()->sync($request->segmentos);
        }

        return new ClienteResource($cliente->fresh(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'galeriaImagens']));
    }

    public function update(ClienteRequest $request, $id)
    {
        $cliente = Cliente::findOrFail($id);
        $cliente->update($request->validated());

        if ($request->has('segmentos')) {
            $cliente->segmentos()->sync($request->segmentos);
        }

        return new ClienteResource($cliente->fresh(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'galeriaImagens']));
    }

    public function destroy($id)
    {
        $cliente = Cliente::findOrFail($id);
        $cliente->delete();
        return response()->json(['success' => true]);
    }

    public function historico($id)
    {
        $cliente = Cliente::findOrFail($id);
        $this->authorize('view', $cliente);

        $historicos = HistoricoAlteracao::where('cliente_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return HistoricoAlteracaoResource::collection($historicos);
    }
}
