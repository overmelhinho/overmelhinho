<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Schema;

class ClienteResource extends JsonResource
{
    public function toArray($request)
    {
        $hasBeneficios = Schema::hasColumn('clientes', 'beneficios');
        $hasPalavrasChave = Schema::hasColumn('clientes', 'palavras_chave');
        $hasHorario = Schema::hasColumn('clientes', 'horario_atendimento');

        $hasSeoKeywords = Schema::hasColumn('clientes', 'seo_keywords');
        $hasSeoSource = Schema::hasColumn('clientes', 'seo_keywords_source');
        $hasSeoUpdatedAt = Schema::hasColumn('clientes', 'seo_keywords_updated_at');

        $hasStatusAssinatura = Schema::hasColumn('clientes', 'status_assinatura');
        $hasTipoCliente = Schema::hasColumn('clientes', 'tipo_cliente');

        $logoUrl = null;
        if (Schema::hasColumn('clientes', 'logo_url')) {
            $logoUrl = $this->logo_url ? asset('storage/' . $this->logo_url) : null;
        }

        return [
            'id' => $this->id,
            'nome_fantasia' => $this->nome_fantasia,
            'razao_social' => $this->razao_social,
            'cpf_cnpj' => $this->cpf_cnpj,
            'nome_alternativo' => $this->nome_alternativo,
            'inscricao_estadual' => $this->inscricao_estadual,
            'inscricao_municipal' => $this->inscricao_municipal,
            'registro_profissional' => $this->registro_profissional,
            'descricao' => $this->descricao,

            // ✅ NOVOS
            'tipo_cliente' => $hasTipoCliente ? ($this->tipo_cliente ?? 'gratuito') : null,
            'status_assinatura' => $hasStatusAssinatura ? ($this->status_assinatura ?? 'pendente') : null,

            'palavras_chave' => $hasPalavrasChave ? $this->palavras_chave : null,
            'horario_atendimento' => $hasHorario ? $this->horario_atendimento : null,
            'beneficios' => $hasBeneficios ? (json_decode($this->beneficios, true) ?: []) : [],

            'logotipo_url' => $logoUrl,

            'seo_keywords' => $hasSeoKeywords ? ($this->seo_keywords ?? []) : null,
            'seo_keywords_source' => $hasSeoSource ? ($this->seo_keywords_source ?? 'generated') : null,
            'seo_keywords_updated_at' => $hasSeoUpdatedAt ? ($this->seo_keywords_updated_at?->toISOString() ?? null) : null,

            'quotes_enabled' => $this->relationLoaded('contatos') 
                ? $this->contatos->whereNotNull('celular')->count() > 0 
                : false,

            'segmentos' => SegmentoResource::collection($this->whenLoaded('segmentos')),
            'enderecos' => EnderecoResource::collection($this->whenLoaded('enderecos')),
            'contatos' => ContatoResource::collection($this->whenLoaded('contatos')),
            'redes_sociais' => RedeSocialResource::collection($this->whenLoaded('redesSociais')),
            'galeria' => GaleriaImagemResource::collection($this->whenLoaded('galeriaImagens')),
            'cidades_atendidas' => CidadeResource::collection($this->whenLoaded('cidadesAtendidas')),
        ];
    }
}
