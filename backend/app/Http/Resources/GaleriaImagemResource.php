<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class GaleriaImagemResource extends JsonResource
{
    public function toArray($request): array
    {
        $url = $this->url;
        if ($url && !Str::startsWith($url, ['http://', 'https://'])) {
            $url = asset('storage/' . $url);
        }

        $thumbUrl = $this->thumb_url;
        if ($thumbUrl && !Str::startsWith($thumbUrl, ['http://', 'https://'])) {
            $thumbUrl = asset('storage/' . $thumbUrl);
        }

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
