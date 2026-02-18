<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OportunidadeResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'lead_id'    => $this->lead_id,
            'cliente_id' => $this->cliente_id,
            'nome'       => $this->nome,
            'etapa'      => $this->etapa,
            'valor_estimado' => $this->valor_estimado,
            'responsavel'=> $this->responsavel,
            'previsao_fechamento' => $this->previsao_fechamento,
            'observacoes' => $this->observacoes,
            'origem'      => $this->origem,
            'status'      => $this->status,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
