<?php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EnderecoResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'           => $this->id,
            'cliente_id'   => $this->cliente_id,
            'cep'          => $this->cep,
            'estado'       => $this->estado,
            'cidade'       => $this->cidade,
            'bairro'       => $this->bairro,
            'rua'          => $this->rua,
            'numero'       => $this->numero,
            'complemento'  => $this->complemento,
            'caixa_postal' => $this->caixa_postal,
            'link_maps'    => $this->link_maps,
            'link_waze'    => $this->link_waze,
            'iframe_maps'  => $this->iframe_maps,
            'latitude'     => $this->latitude ? (float) $this->latitude : null,
            'longitude'    => $this->longitude ? (float) $this->longitude : null,
            'exibir_apenas_cidade' => (bool) $this->exibir_apenas_cidade,
            'is_cobranca'          => (bool) $this->is_cobranca,
            'endereco_compacto'    => $this->endereco_compacto,
            'created_at'   => $this->created_at,
            'updated_at'   => $this->updated_at,
        ];
    }
}
