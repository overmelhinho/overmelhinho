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
            'obs_telefone_principal' => $this->obs_telefone_principal,
            'telefone_secundario' => $this->telefone_secundario,
            'obs_telefone_secundario' => $this->obs_telefone_secundario,
            'celular'             => $this->celular,
            'obs_celular'         => $this->obs_celular,
            'telefone_outro'      => $this->telefone_outro,
            'obs_telefone_outro'  => $this->obs_telefone_outro,
            'whatsapp_selected'   => $this->whatsapp_selected,
            'exibir_tel_principal'            => $this->exibir_tel_principal,
            'telefone_principal_hidden_until'  => $this->telefone_principal_hidden_until?->toISOString(),
            'exibir_tel_secundario'            => $this->exibir_tel_secundario,
            'exibir_celular'      => $this->exibir_celular,
            'exibir_tel_outro'    => $this->exibir_tel_outro,
            'exibir_email'        => $this->exibir_email,
            'has_whatsapp_principal'  => (bool) $this->has_whatsapp_principal,
            'has_whatsapp_secundario' => (bool) $this->has_whatsapp_secundario,
            'has_whatsapp_celular'    => (bool) $this->has_whatsapp_celular,
            'has_whatsapp_outro'      => (bool) $this->has_whatsapp_outro,
            'email_principal'     => $this->email_principal,
            'email_cobranca'      => $this->email_cobranca,
            'site'                => $this->site,
            'nome_contato'        => $this->nome_contato,
            'created_at'          => $this->created_at,
            'updated_at'          => $this->updated_at,
        ];
    }
}
