<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CidadeResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'uf' => $this->uf,
        ];
    }
}
