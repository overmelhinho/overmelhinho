<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\RedeSocial;
use App\Http\Requests\RedeSocialRequest;
use App\Http\Resources\RedeSocialResource;
use Illuminate\Http\Request;

class RedeSocialController extends Controller
{
    public function index($clienteId)
    {
        $redes = RedeSocial::where('cliente_id', $clienteId)->get();
        return RedeSocialResource::collection($redes);
    }


   public function store(RedeSocialRequest $request, $clienteId)
{
    $cliente = Cliente::findOrFail($clienteId);
    $data = $request->validated();

    $data['tipo'] = strtolower(trim($data['tipo']));

    $rede = RedeSocial::updateOrCreate(
        ['cliente_id' => $cliente->id, 'tipo' => $data['tipo']],
        ['url' => $data['url'] ?? null]
    );

    return new RedeSocialResource($rede);
}



    public function show($clienteId, $redeId)
    {
        $rede = RedeSocial::where('cliente_id', $clienteId)->findOrFail($redeId);
        return new RedeSocialResource($rede);
    }

    public function update(RedeSocialRequest $request, $clienteId, $redeId)
    {
        $rede = RedeSocial::where('cliente_id', $clienteId)->findOrFail($redeId);
        $rede->update($request->validated());
        return new RedeSocialResource($rede);
    }

    public function destroy($clienteId, $redeId)
    {
        $rede = RedeSocial::where('cliente_id', $clienteId)->findOrFail($redeId);
        $rede->delete();
        return response()->json(['success' => true]);
    }
}
