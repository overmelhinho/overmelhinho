<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RedeSocialResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'cliente_id' => $this->cliente_id,
            'tipo'       => $this->tipo,
            'url'        => $this->url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
