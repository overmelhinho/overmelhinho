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
            'nome_unidade' => $this->nome_unidade,
            'telefone'     => $this->telefone,
            'estado'       => $this->estado,
            'cidade'       => $this->cidade,
            'bairro'       => $this->bairro,
            'tipo_logradouro' => $this->tipo_logradouro,
            'rua'          => $this->rua,
            'numero'       => $this->numero,
            'complemento'  => $this->complemento,
            'caixa_postal' => $this->caixa_postal,
            'link_maps'    => $this->link_maps,
            'link_waze'    => $this->link_waze,
            'iframe_maps'  => $this->iframe_maps,
            'latitude'     => $this->latitude ? (float) $this->latitude : null,
            'longitude'    => $this->longitude ? (float) $this->longitude : null,
            'exibir_apenas_cidade' => filter_var($this->exibir_apenas_cidade, FILTER_VALIDATE_BOOLEAN),
            'is_cobranca'          => filter_var($this->is_cobranca, FILTER_VALIDATE_BOOLEAN),
            'endereco_compacto'    => $this->endereco_compacto,
            'created_at'   => $this->created_at,
            'updated_at'   => $this->updated_at,
        ];
    }
}
