<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\GaleriaImagem;
use App\Http\Requests\GaleriaImagemRequest;
use App\Http\Resources\GaleriaImagemResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;


class GaleriaImagemController extends Controller
{
    public function index($clienteId)
    {
        $galeria = GaleriaImagem::where('cliente_id', $clienteId)
            ->orderBy('ordem')
            ->get();
        return GaleriaImagemResource::collection($galeria);
    }

    public function store(GaleriaImagemRequest $request, $clienteId)
    {
        $cliente = Cliente::findOrFail($clienteId);
        $imagem = $cliente->galeriaImagens()->create($request->validated());
        return new GaleriaImagemResource($imagem);
    }

    public function show($clienteId, $imagemId)
    {
        $imagem = GaleriaImagem::where('cliente_id', $clienteId)->findOrFail($imagemId);
        return new GaleriaImagemResource($imagem);
    }

    public function update(GaleriaImagemRequest $request, $clienteId, $imagemId)
    {
        $imagem = GaleriaImagem::where('cliente_id', $clienteId)->findOrFail($imagemId);
        $imagem->update($request->validated());
        return new GaleriaImagemResource($imagem);
    }



public function destroy($clienteId, $imagemId)
{
    $imagem = \App\Models\GaleriaImagem::where('cliente_id', $clienteId)->findOrFail($imagemId);

    // Deleta imagem principal
    $storagePath = str_replace('/storage/', '', parse_url($imagem->url, PHP_URL_PATH));
    if ($storagePath && Storage::disk(config('filesystems.default'))->exists($storagePath)) {
        Storage::disk(config('filesystems.default'))->delete($storagePath);
    }

    // Deleta thumbnail (se existir)
    if ($imagem->thumb_url) {
        $thumbPath = str_replace('/storage/', '', parse_url($imagem->thumb_url, PHP_URL_PATH));
        if ($thumbPath && Storage::disk(config('filesystems.default'))->exists($thumbPath)) {
            Storage::disk(config('filesystems.default'))->delete($thumbPath);
        }
    }

    $imagem->delete();
    return response()->json(['success' => true]);
}


public function upload(Request $request, $clienteId)
{
    $request->validate([
        'imagem' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048', // 2MB máx
        'legenda' => 'nullable|string|max:191',
        'ordem'   => 'nullable|integer|min:0'
    ]);

    $cliente = Cliente::findOrFail($clienteId);

    $file = $request->file('imagem');
    $path = $file->store('clientes/' . $clienteId . '/galeria', config('filesystems.default'));

    $imagem = $cliente->galeriaImagens()->create([
        'url' => Storage::url($path), // URL acessível
        'legenda' => $request->legenda,
        'ordem'   => $request->ordem ?? 0,
    ]);

    return new GaleriaImagemResource($imagem);
}


public function uploadMultiple(Request $request, $clienteId)
{
    $request->validate([
        'imagens'   => 'required|array|min:1',
        'imagens.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        'legenda'   => 'nullable|string|max:191',
        'ordem'     => 'nullable|integer|min:0'
    ]);

    $cliente = \App\Models\Cliente::findOrFail($clienteId);
    $imagensCriadas = [];

    foreach ($request->file('imagens') as $file) {
        // Salva imagem principal
        $path = $file->store('clientes/' . $clienteId . '/galeria', config('filesystems.default'));
        $url = Storage::url($path);

        // Gera thumbnail
        $thumbPath = $this->generateThumbnail($file, $clienteId);

        $imagem = $cliente->galeriaImagens()->create([
            'url'     => $url,
            'legenda' => $request->legenda,
            'ordem'   => $request->ordem ?? 0,
            'thumb_url' => $thumbPath ? Storage::url($thumbPath) : null,
        ]);

        $imagensCriadas[] = new GaleriaImagemResource($imagem);
    }

    return response()->json($imagensCriadas, 201);
}


private function generateThumbnail($file, $clienteId)
{
    try {
        $image = Image::make($file)->resize(300, 300, function ($constraint) {
            $constraint->aspectRatio();
            $constraint->upsize();
        });

        $thumbPath = 'clientes/' . $clienteId . '/galeria/thumbs/' . uniqid() . '.jpg';
        Storage::put($thumbPath, (string) $image->encode('jpg', 80));

        return $thumbPath;
    } catch (\Exception $e) {
        // Log error se preferir
        return null;
    }
}




}
