<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UploadTempController extends Controller
{
    public function uploadTemp(Request $request)
    {
        $request->validate([
            'files' => 'required',
            'files.*' => 'file|max:10240|mimes:jpg,jpeg,png,webp,pdf',
        ]);

        $supabaseUrl = rtrim(env('SUPABASE_URL'), '/');
        $supabaseKey = env('SUPABASE_KEY'); // ⚠️ ideal: SERVICE_ROLE no backend
        $bucket = env('SUPABASE_BUCKET', 'clientes-media');
        $userId = auth()->id() ?? 'guest';

        $results = [];
        $errors = [];

        $files = $request->file('files', []);
        if (!is_array($files)) $files = [$files];

        foreach ($files as $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            $filename = Str::uuid() . '.' . $extension;
            $path = "temp/{$userId}/{$filename}";
            $mime = $file->getMimeType() ?: 'application/octet-stream';

            try {
                $bytes = file_get_contents($file->getRealPath());
                if ($bytes === false || strlen($bytes) === 0) {
                    throw new \Exception("Falha ao ler arquivo (bytes vazios)");
                }

                $url = "{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}";

                $response = Http::withHeaders([
                    'apikey'        => $supabaseKey,
                    'Authorization' => "Bearer {$supabaseKey}",
                    'Content-Type'  => $mime,
                    'x-upsert'      => 'true',
                ])->withBody($bytes, $mime)->post($url);

                // Supabase retorna 200 ou 200 para uploads bem-sucedidos
                if ($response->failed()) {
                    Log::error('UPLOAD_TEMP_SUPABASE_FAIL', [
                        'status'   => $response->status(),
                        'body'     => $response->body(),
                        'path'     => $path,
                        'mime'     => $mime,
                        'url'      => $url,
                    ]);
                    throw new \Exception("Supabase {$response->status()}: " . $response->body());
                }

                $results[] = [
                    'name' => $filename,
                    'path' => $path,
                    'mime' => $mime,
                    'size_kb' => round($file->getSize() / 1024, 2),
                    'public_url' => "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}",
                ];
            } catch (\Throwable $e) {
                Log::error('UPLOAD_TEMP_FAIL', [
                    'file' => $file->getClientOriginalName(),
                    'mime' => $mime,
                    'size' => $file->getSize(),
                    'error' => $e->getMessage(),
                ]);

                $errors[] = [
                    'file' => $file->getClientOriginalName(),
                    'reason' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => count($results) > 0,
            'files' => $results,
            'errors' => $errors,
            'message' => count($errors)
                ? 'Alguns arquivos falharam no upload.'
                : 'Upload realizado com sucesso.',
        ]);
    }
}
