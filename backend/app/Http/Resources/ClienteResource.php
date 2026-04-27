<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class ClienteResource extends JsonResource
{
    /**
     * Cache estático para evitar multiplas chamadas de Schema por request
     * No entanto, como as colunas já estão consolidadas, removeremos as checagens 
     * para máxima performance de listagem.
     */
    public function toArray($request)
    {
        // Tratamento de URL do Logo (Suporta local e externo)
        $logoUrl = $this->logo_url;
        if ($logoUrl && !Str::startsWith($logoUrl, ['http://', 'https://'])) {
            $logoUrl = asset('storage/' . $logoUrl);
        }

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'nome_fantasia' => $this->nome_fantasia,
            'razao_social' => $this->razao_social,
            'cpf_cnpj' => $this->cpf_cnpj,
            'nome_alternativo' => $this->nome_alternativo,
            'inscricao_estadual' => $this->inscricao_estadual,
            'inscricao_municipal' => $this->inscricao_municipal,
            'registro_profissional' => $this->registro_profissional,
            'descricao' => $this->descricao,
            'observacoes' => $this->observacoes,

            // ✅ Atributos Consolidados (Removido checks de Schema p/ performance)
            'tipo_cliente' => $this->tipo_cliente ?? 'gratuito',
            'status_assinatura' => $this->status_assinatura ?? 'ativa',

            'palavras_chave' => $this->palavras_chave,
            'exibir_no_site' => (bool) ($this->exibir_no_site ?? true),
            'exibir_data_fundacao' => (bool) ($this->exibir_data_fundacao ?? true),
            'horario_atendimento' => $this->horario_atendimento,
            'beneficios' => is_string($this->beneficios) ? (json_decode($this->beneficios, true) ?: []) : ($this->beneficios ?: []),

            'logotipo_url' => $logoUrl,
            'logo_url' => $logoUrl, // ✅ Alias para o frontend identificar pendência

            'seo_keywords' => $this->seo_keywords ?? [],
            'seo_keywords_source' => $this->seo_keywords_source ?? 'generated',
            'seo_keywords_updated_at' => $this->seo_keywords_updated_at ? (is_string($this->seo_keywords_updated_at) ? $this->seo_keywords_updated_at : $this->seo_keywords_updated_at->toIso8601String()) : null,

            'galeria_imagens_count' => $this->galeria_imagens_count ?? ($this->relationLoaded('galeriaImagens') ? $this->galeriaImagens->count() : 0),
            
            'quotes_enabled' => $this->relationLoaded('contatos') 
                ? $this->contatos->whereNotNull('celular')->count() > 0 
                : false,

            'segmentos' => SegmentoResource::collection($this->whenLoaded('segmentos')),
            'enderecos' => EnderecoResource::collection($this->whenLoaded('enderecos')),
            'contatos' => ContatoResource::collection($this->whenLoaded('contatos')),
            'redes_sociais' => RedeSocialResource::collection($this->whenLoaded('redesSociais')),
            'galeria' => GaleriaImagemResource::collection($this->whenLoaded('galeriaImagens')),
            'cidades_atendidas' => CidadeResource::collection($this->whenLoaded('cidadesAtendidas')),
            'reviews' => ClienteReviewResource::collection($this->whenLoaded('reviews')),
            'job_opportunities' => $this->whenLoaded('jobOpportunities'),

            'video' => $this->video,
            'portfolio_url' => $this->portfolio_url,
            'tipo_arquivo_midia' => $this->tipo_arquivo_midia ?? 'catalogo',

            'google_place_id' => $this->google_place_id,
            'data_fundacao' => $this->data_fundacao ? (is_string($this->data_fundacao) ? $this->data_fundacao : $this->data_fundacao->format('Y-m-d')) : null,
            'google_rating' => $this->reviews_count ? round(5.0, 1) : null,
            'reviews_count' => $this->reviews_count ?? 0,

            // ✅ Novos Campos de Auditoria
            'audit_status' => $this->audit_status ?? 'ok',
            'last_audit_at' => $this->last_audit_at ? (is_string($this->last_audit_at) ? $this->last_audit_at : $this->last_audit_at->toIso8601String()) : null,
            'audit_differences' => is_string($this->audit_differences) ? json_decode($this->audit_differences, true) : $this->audit_differences,
            'contact_preference' => $this->contact_preference,
            'best_contact_shift' => $this->best_contact_shift,
        ];
    }
}
