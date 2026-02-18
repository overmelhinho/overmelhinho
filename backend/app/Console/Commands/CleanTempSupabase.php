<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class CleanTempSupabase extends Command
{
    protected $signature = 'supabase:clean-temp';
    protected $description = 'Remove arquivos temporários antigos do bucket clientes-media/temp/';

    public function handle()
    {
        $url = rtrim(config('services.supabase.url'), '/');
        $key = config('services.supabase.key');
        $bucket = config('services.supabase.bucket', 'clientes-media');

        $this->info("🧹 Limpando arquivos temporários no bucket {$bucket}...");

        try {
            // 🔍 Lista arquivos do bucket (Supabase Storage REST API)
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$key}",
                'apikey' => $key,
                'Content-Type' => 'application/json',
            ])->post("{$url}/storage/v1/object/list/{$bucket}", [
                'prefix' => 'temp/',
                'limit' => 1000,
            ]);

            if (!$response->successful()) {
                $this->error("Erro ao listar arquivos: " . $response->body());
                return Command::FAILURE;
            }

            $arquivos = collect($response->json());

            $limite = Carbon::now()->subHours(48);
            $removidos = 0;

            foreach ($arquivos as $arquivo) {
                $updatedAt = Carbon::parse($arquivo['updated_at']);
                if ($updatedAt->lt($limite)) {
                    $path = "temp/" . $arquivo['name'];

                    Http::withHeaders([
                        'Authorization' => "Bearer {$key}",
                        'apikey' => $key,
                    ])->delete("{$url}/storage/v1/object/{$bucket}/{$path}");

                    $this->line("🗑️ Removido: {$path}");
                    $removidos++;
                }
            }

            $this->info("✅ Limpeza concluída — {$removidos} arquivos removidos.");
            return Command::SUCCESS;

        } catch (\Throwable $e) {
            $this->error("Erro ao limpar temporários: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }
}
