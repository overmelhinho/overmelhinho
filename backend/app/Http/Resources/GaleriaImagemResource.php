<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class GaleriaImagemResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'cliente_id' => $this->cliente_id,
            'url'        => $this->url,
            'thumb_url'  => $this->thumb_url,
            'legenda'    => $this->legenda,
            'ordem'      => $this->ordem,
            'created_at' => $this->created_at,
        ];
    }
}
