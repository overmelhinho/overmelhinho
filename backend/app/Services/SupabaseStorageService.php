<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SupabaseStorageService
{
    public function __construct(
        private string $baseUrl,
        private string $serviceKey,
        private string $bucket
    ) {}

    public static function fromEnv(): self
    {
        return new self(
            rtrim(env('SUPABASE_URL'), '/'),
            env('SUPABASE_KEY'),
            env('SUPABASE_BUCKET', 'clientes-media')
        );
    }

    private function headers(): array
    {
        return [
            'apikey' => $this->serviceKey,
            'Authorization' => "Bearer {$this->serviceKey}",
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * MOVE (copy + delete) usando Storage API:
     * POST /storage/v1/object/move
     */
    public function move(string $fromPath, string $toPath): void
    {
        $url = "{$this->baseUrl}/storage/v1/object/move";

        $res = Http::withHeaders($this->headers())->post($url, [
            'bucketId' => $this->bucket,
            'sourceKey' => $fromPath,
            'destinationKey' => $toPath,
        ]);

        if ($res->failed()) {
            throw new \Exception("Supabase move failed: " . $res->body());
        }
    }

    public function publicUrl(string $path): string
    {
        return "{$this->baseUrl}/storage/v1/object/public/{$this->bucket}/{$path}";
    }
}
