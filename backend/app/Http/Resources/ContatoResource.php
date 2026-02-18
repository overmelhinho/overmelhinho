<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ContatoResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                  => $this->id,
            'cliente_id'          => $this->cliente_id,
            'telefone_principal'  => $this->telefone_principal,
            'telefone_secundario' => $this->telefone_secundario,
            'celular'             => $this->celular,
            'whatsapp_principal'  => $this->whatsapp_principal,
            'whatsapp_secundario' => $this->whatsapp_secundario,
            'email_principal'     => $this->email_principal,
            'email_cobranca'      => $this->email_cobranca,
            'site'                => $this->site,
            'nome_contato'        => $this->nome_contato,
            'created_at'          => $this->created_at,
            'updated_at'          => $this->updated_at,
        ];
    }
}
