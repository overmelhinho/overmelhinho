<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class GaleriaImagemResource extends JsonResource
{
    public function toArray($request): array
    {
        $formatStorageUrl = function(?string $path) {
            if (!$path) return null;
            if (Str::startsWith($path, ['http://', 'https://'])) {
                return $path;
            }
            
            $cleanPath = ltrim($path, '/');

            if (!Str::startsWith($cleanPath, ['clientes/', 'temp/', 'v1/object/public/'])) {
                $legacyBase = env('LEGACY_STORAGE_URL', 'https://api.overmelhinho.com.br/storage/');
                return rtrim($legacyBase, '/') . '/' . $cleanPath;
            }

            $supabaseUrl = rtrim(env('SUPABASE_URL', 'https://spefwgjsltjryxcizype.supabase.co'), '/');
            $bucket = env('SUPABASE_BUCKET', 'clientes-media');
            
            if (Str::startsWith($cleanPath, 'v1/object/public/')) {
                return "{$supabaseUrl}/storage/{$cleanPath}";
            }
            
            return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$cleanPath}";
        };

        $url = $formatStorageUrl($this->url);
        $thumbUrl = $formatStorageUrl($this->thumb_url);

        return [
            'id'         => $this->id,
            'cliente_id' => $this->cliente_id,
            'url'        => $url,
            'thumb_url'  => $thumbUrl,
            'legenda'    => $this->legenda,
            'ordem'      => $this->ordem,
            'created_at' => $this->created_at,
        ];
    }
}
