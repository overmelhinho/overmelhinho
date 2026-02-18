<?php

namespace App\Jobs;

use App\Models\GaleriaImagem;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MoveClienteMediaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userId;
    protected $clienteId;

    /**
     * Cria a instância do Job.
     */
    public function __construct($userId, $clienteId)
    {
        $this->userId = $userId;
        $this->clienteId = $clienteId;
    }

    /**
     * Executa o job: move arquivos do /temp/{user}/ para /clientes/{id}/
     */
    public function handle(): void
    {
        $bucket = env('SUPABASE_BUCKET', 'clientes-media');
        $supabaseUrl = rtrim(env('SUPABASE_URL'), '/');
        $supabaseKey = env('SUPABASE_KEY');

        if (!$supabaseUrl || !$supabaseKey) {
            Log::error('❌ Configurações Supabase ausentes em .env');
            return;
        }

        $headers = [
            'apikey' => $supabaseKey,
            'Authorization' => "Bearer {$supabaseKey}",
            'Content-Type' => 'application/json',
        ];

        $sourcePath = "temp/{$this->userId}";
        $destPath = "clientes/{$this->clienteId}";

        // 1️⃣ Lista arquivos no diretório temporário
        $listUrl = "{$supabaseUrl}/storage/v1/object/list/{$bucket}";
        $response = Http::withHeaders($headers)->post($listUrl, [
            'prefix' => $sourcePath,
        ]);

        if (!$response->ok()) {
            Log::error("❌ Falha ao listar arquivos temporários: {$response->body()}");
            return;
        }

        $files = $response->json() ?? [];
        if (empty($files)) {
            Log::info("ℹ️ Nenhum arquivo encontrado em {$sourcePath}");
            return;
        }

        foreach ($files as $file) {
            $fileName = basename($file['name']);

            // 2️⃣ Copia o arquivo para a pasta definitiva
            $copyUrl = "{$supabaseUrl}/storage/v1/object/move/{$bucket}/{$sourcePath}/{$fileName}";
            $moveResponse = Http::withHeaders($headers)->post($copyUrl, [
                'destination' => "{$destPath}/{$fileName}",
            ]);

            if (!$moveResponse->ok()) {
                Log::error("⚠️ Erro ao mover {$fileName}: {$moveResponse->body()}");
                continue;
            }

            // 3️⃣ Cria registro da imagem na tabela
            $publicUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$destPath}/{$fileName}";

            GaleriaImagem::create([
                'cliente_id' => $this->clienteId,
                'url' => $publicUrl,
                'legenda' => "Imagem de cliente #{$this->clienteId}",
                'ordem' => 0,
            ]);
        }

        Log::info("✅ Arquivos movidos com sucesso para {$destPath}");
    }
}
