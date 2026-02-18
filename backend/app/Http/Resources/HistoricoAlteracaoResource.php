<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class HistoricoAlteracaoResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'cliente_id'    => $this->cliente_id,
            'usuario_id'    => $this->usuario_id,
            'campo_alterado'=> $this->campo_alterado,
            'valor_antigo'  => $this->valor_antigo,
            'valor_novo'    => $this->valor_novo,
            'created_at'    => $this->created_at,
        ];
    }
}
