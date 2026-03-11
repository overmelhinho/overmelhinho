<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\GaleriaImagem;
use App\Http\Requests\GaleriaImagemRequest;
use App\Http\Resources\GaleriaImagemResource;
use App\Services\HistoricoAlteracaoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
        $data = $request->validated();

        $imagem = GaleriaImagem::firstOrCreate(
            ['cliente_id' => $cliente->id, 'url' => $data['url']],
            [
                'legenda'   => $data['legenda'] ?? null,
                'ordem'     => $data['ordem'] ?? 0,
                'thumb_url' => $data['thumb_url'] ?? null,
            ]
        );

        $updates = [];
        foreach (['legenda','ordem','thumb_url'] as $k) {
            if (array_key_exists($k, $data) && $data[$k] !== null) {
                $updates[$k] = $data[$k];
            }
        }
        if (!empty($updates)) {
            $before = $imagem->fresh()->toArray();
            $imagem->update($updates);
            $after = $imagem->fresh()->toArray();

            HistoricoAlteracaoService::logAction($clienteId, 'galeria_update', $after, $before);
        } else {
            HistoricoAlteracaoService::logAction($clienteId, 'galeria_add', [
                'id' => $imagem->id,
                'url' => $imagem->url,
                'thumb_url' => $imagem->thumb_url,
                'legenda' => $imagem->legenda,
            ]);
        }

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

        $before = $imagem->fresh()->toArray();
        $imagem->update($request->validated());
        $after = $imagem->fresh()->toArray();

        HistoricoAlteracaoService::logAction($clienteId, 'galeria_update', $after, $before);

        return new GaleriaImagemResource($imagem);
    }

    public function destroy($clienteId, $imagemId)
    {
        $imagem = GaleriaImagem::where('cliente_id', $clienteId)->findOrFail($imagemId);

        HistoricoAlteracaoService::logAction($clienteId, 'galeria_delete', [
            'id' => $imagem->id,
            'url' => $imagem->url,
            'thumb_url' => $imagem->thumb_url,
        ]);

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
            'imagem' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'legenda' => 'nullable|string|max:191',
            'ordem'   => 'nullable|integer|min:0'
        ]);

        $cliente = Cliente::findOrFail($clienteId);

        $file = $request->file('imagem');
        $path = $file->store('clientes/' . $clienteId . '/galeria', config('filesystems.default'));

        $imagem = $cliente->galeriaImagens()->create([
            'url' => Storage::url($path),
            'legenda' => $request->legenda,
            'ordem'   => $request->ordem ?? 0,
        ]);

        HistoricoAlteracaoService::logAction($clienteId, 'galeria_add', [
            'id' => $imagem->id,
            'url' => $imagem->url,
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

        $cliente = Cliente::findOrFail($clienteId);
        $imagensCriadas = [];

        foreach ($request->file('imagens') as $file) {
            $path = $file->store('clientes/' . $clienteId . '/galeria', config('filesystems.default'));
            $url = Storage::url($path);

            $thumbPath = $this->generateThumbnail($file, $clienteId);

            $imagem = $cliente->galeriaImagens()->create([
                'url'     => $url,
                'legenda' => $request->legenda,
                'ordem'   => $request->ordem ?? 0,
                'thumb_url' => $thumbPath ? Storage::url($thumbPath) : null,
            ]);

            HistoricoAlteracaoService::logAction($clienteId, 'galeria_add', [
                'id' => $imagem->id,
                'url' => $imagem->url,
                'thumb_url' => $imagem->thumb_url,
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
            return null;
        }
    }

    public function commitTemp(Request $request, $clienteId)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.temp_path' => 'required|string',
        ]);

        $cliente = Cliente::findOrFail($clienteId);

        $supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $supabaseKey = config('services.supabase.service_role_key') ?: config('services.supabase.key');
        $bucket = config('services.supabase.bucket', 'clientes-media');

        $updated = [];
        $errors = [];

        foreach ($request->input('items') as $item) {
            try {
                $img = GaleriaImagem::where('cliente_id', $clienteId)->findOrFail($item['id']);

                $beforeUrl = $img->url;

                $tempPath = ltrim($item['temp_path'], '/');
                if (!Str::startsWith($tempPath, 'temp/')) {
                    throw new \Exception("temp_path inválido: {$tempPath}");
                }

                $filename = basename($tempPath);
                $destPath = "clientes/{$clienteId}/galeria/{$filename}";

                $copyUrl = "{$supabaseUrl}/storage/v1/object/copy";
                $copyPayload = [
                    'bucketId'     => $bucket,
                    'sourceKey'    => $tempPath,
                    'destinationKey' => $destPath,
                    'destinationBucketId' => $bucket,
                ];

                $copyResp = Http::withHeaders([
                    'apikey' => $supabaseKey,
                    'Authorization' => "Bearer {$supabaseKey}",
                    'Content-Type' => 'application/json',
                ])->post($copyUrl, $copyPayload);

                if ($copyResp->failed()) {
                    $copyData = $copyResp->json();
                    if ($copyResp->status() === 409 || ($copyResp->status() === 400 && ($copyData['statusCode'] ?? '') == '409')) {
                        $delDestUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}";
                        Http::withHeaders([
                            'apikey' => $supabaseKey,
                            'Authorization' => "Bearer {$supabaseKey}",
                            'Content-Type' => 'application/json',
                        ])->delete($delDestUrl, ['prefixes' => [$destPath]]);

                        $copyResp = Http::withHeaders([
                            'apikey' => $supabaseKey,
                            'Authorization' => "Bearer {$supabaseKey}",
                            'Content-Type' => 'application/json',
                        ])->post($copyUrl, $copyPayload);
                    }

                    if ($copyResp->failed()) {
                        throw new \Exception("COPY failed {$copyResp->status()}: " . $copyResp->body());
                    }
                }

                $delUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}";
                $delResp = Http::withHeaders([
                    'apikey' => $supabaseKey,
                    'Authorization' => "Bearer {$supabaseKey}",
                    'Content-Type' => 'application/json',
                ])->delete($delUrl, ['prefixes' => [$tempPath]]);

                if ($delResp->failed()) {
                    Log::warning('SUPABASE_TEMP_DELETE_FAIL', [
                        'cliente_id' => $clienteId,
                        'temp_path'  => $tempPath,
                        'status'     => $delResp->status(),
                        'body'       => $delResp->body(),
                    ]);
                }

                $finalUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$destPath}";
                $img->update(['url' => $finalUrl]);

                // ✅ LOG
                HistoricoAlteracaoService::logAction($clienteId, 'galeria_commit', $finalUrl, $beforeUrl);

                $updated[] = $img->id;
            } catch (\Throwable $e) {
                $errors[] = [
                    'id' => $item['id'] ?? null,
                    'temp_path' => $item['temp_path'] ?? null,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => count($errors) === 0,
            'updated_ids' => $updated,
            'errors' => $errors,
        ], count($errors) ? 207 : 200);
    }
}
