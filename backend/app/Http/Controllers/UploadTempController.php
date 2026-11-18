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
        // 🔒 Verificação prévia de erros nativos do PHP antes da validação
        $rawFiles = $request->file('files', []);
        if (!is_array($rawFiles)) {
            $rawFiles = $rawFiles ? [$rawFiles] : [];
        }

        foreach ($rawFiles as $file) {
            if ($file instanceof \Symfony\Component\HttpFoundation\File\UploadedFile && $file->getError() !== UPLOAD_ERR_OK) {
                $err = $file->getError();
                $originalName = $file->getClientOriginalName() ?: 'arquivo';
                
                if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
                    $maxIni = ini_get('upload_max_filesize') ?: '30M';
                    return response()->json([
                        'success' => false,
                        'message' => "O arquivo \"{$originalName}\" excede o limite de tamanho permitido pelo servidor ({$maxIni}). Por favor, otimize ou comprima o PDF antes de enviar.",
                        'errors' => ['files' => ["Arquivo excede o limite de upload do servidor ({$maxIni})."]]
                    ], 422);
                }

                if ($err === UPLOAD_ERR_PARTIAL) {
                    return response()->json([
                        'success' => false,
                        'message' => "O envio do arquivo \"{$originalName}\" foi interrompido antes de ser concluído. Verifique sua conexão e tente novamente.",
                        'errors' => ['files' => ['Upload parcial/interrompido.']]
                    ], 422);
                }

                return response()->json([
                    'success' => false,
                    'message' => "Falha no envio do arquivo \"{$originalName}\" (Código PHP: {$err}). Verifique o arquivo e tente novamente.",
                    'errors' => ['files' => ["Erro de upload código {$err}."]]
                ], 422);
            }
        }

        try {
            $request->validate([
                'files' => 'required',
                'files.*' => 'file|max:30720|mimes:jpg,jpeg,png,webp,pdf,gif|mimetypes:image/jpeg,image/png,image/webp,image/gif,application/pdf',
            ], [
                'files.required' => 'Nenhum arquivo foi selecionado.',
                'uploaded' => 'Falha no envio do arquivo. Verifique se o arquivo não excede o limite de tamanho permitido.',
                'files.*.uploaded' => 'Falha no envio do arquivo. Verifique se o arquivo não excede o limite de tamanho do servidor.',
                'files.uploaded' => 'Falha no envio do arquivo. Verifique se o arquivo não excede o limite de tamanho do servidor.',
                'files.*.max' => 'O arquivo não pode ser maior que 30 MB.',
                'files.*.mimes' => 'Formato não suportado. Formatos aceitos: PDF, JPG, PNG, WEBP, GIF.',
                'files.*.mimetypes' => 'Formato não suportado. Formatos aceitos: PDF, JPG, PNG, WEBP, GIF.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('UploadTemp Validation Failed: ' . json_encode($e->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação: ' . collect($e->errors())->flatten()->implode(' '),
                'errors' => $e->errors()
            ], 422);
        }

        $supabaseUrl = rtrim(config('services.supabase.url', ''), '/');
        $supabaseKey = config('services.supabase.key'); // SERVICE_ROLE key
        $bucket = config('services.supabase.bucket', 'clientes-media');
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
