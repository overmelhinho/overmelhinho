<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;
use App\Http\Requests\ClienteRequest;
use App\Http\Resources\ClienteResource;
use App\Jobs\MoveClienteMediaJob;

class ClienteController extends Controller
{
    public function index()
    {
        $clientes = Cliente::with([
            'enderecos',
            'contatos',
            'redesSociais',
            'segmentos',
            'galeriaImagens'
        ])->paginate(15);

        return ClienteResource::collection($clientes);
    }


public function store(ClienteRequest $request)
{
    $data = $request->validated();

    $cliente = Cliente::create($data);

    if (isset($data['segmentos'])) {
        $cliente->segmentos()->sync($data['segmentos']);
    }

    // 🔄 Enfileira o job de mover arquivos
    try {
        $userId = auth()->id() ?? 'guest';
        MoveClienteMediaJob::dispatch($userId, $cliente->id);
        \Log::info("Job MoveClienteMediaJob despachado para cliente {$cliente->id}");
    } catch (\Throwable $e) {
        \Log::error("Falha ao despachar MoveClienteMediaJob: {$e->getMessage()}");
    }

    return new \App\Http\Resources\ClienteResource(
        $cliente->load([
            'enderecos',
            'contatos',
            'redesSociais',
            'segmentos',
            'galeriaImagens'
        ])
    );
}


    public function show($id)
    {
        $cliente = Cliente::with([
            'enderecos',
            'contatos',
            'redesSociais',
            'segmentos',
            'galeriaImagens'
        ])->findOrFail($id);

        return new ClienteResource($cliente);
    }

    public function update(ClienteRequest $request, $id)
    {
        $data = $request->validated();

        $cliente = Cliente::findOrFail($id);
        $cliente->update($data);

        if (isset($data['segmentos'])) {
            $cliente->segmentos()->sync($data['segmentos']);
        }

        return new ClienteResource(
            $cliente->load([
                'enderecos',
                'contatos',
                'redesSociais',
                'segmentos',
                'galeriaImagens'
            ])
        );
    }

    public function destroy($id)
    {
        $cliente = Cliente::findOrFail($id);
        $cliente->delete();

        return response()->json(['message' => 'Cliente deletado com sucesso.']);
    }
}
