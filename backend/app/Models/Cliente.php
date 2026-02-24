<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\Auditable;

class Cliente extends Model
{
    use Auditable;

    protected string $auditEntityType = 'cliente';

    // opcional (recomendado)
    protected array $auditIgnore = [
        'seo_keywords_updated_at',
    ];

    protected $table = 'clientes';

    protected $fillable = [
        'nome_fantasia',
        'razao_social',
        'nome_alternativo',
        'cpf_cnpj',
        'inscricao_estadual',
        'inscricao_municipal',
        'registro_profissional',
        'descricao',
        'observacoes',
        'video',
        'portfolio_url',
        'logo_url',
        'possui_publicidade',
        'seo_keywords',
        'seo_keywords_source',
        'seo_keywords_updated_at',
        'tiny_id',
        'status_assinatura',
        'tipo_cliente',
        'plan_id',
        'recurrence_day',
        'last_invoice_generated_at',
        'contact_preference',
        'best_contact_shift',
        'contract_ends_at',
        'beneficios',
        'horario_atendimento',
    ];

    public function renewals()
    {
        return $this->hasMany(Renewal::class, 'cliente_id');
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
    public function invoices()
    {
        return $this->hasMany(Invoice::class , 'client_id');
    }

    protected $casts = [
        'possui_publicidade' => 'boolean',
        'seo_keywords' => 'array',
        'beneficios' => 'array',
        'seo_keywords_updated_at' => 'datetime',
        'contract_ends_at' => 'date',
    ];

    public function setCpfCnpjAttribute($value): void
    {
        $this->attributes['cpf_cnpj'] = preg_replace('/\D+/', '', (string)$value) ?? '';
    }

    public function enderecos()
    {
        return $this->hasMany(Endereco::class , 'cliente_id');
    }

    public function contatos()
    {
        return $this->hasMany(Contato::class , 'cliente_id');
    }

    public function redesSociais()
    {
        return $this->hasMany(RedeSocial::class , 'cliente_id');
    }

    public function segmentos()
    {
        return $this->belongsToMany(Segmento::class , 'cliente_segmento', 'cliente_id', 'segmento_id');
    }

    public function cidadesAtendidas()
    {
        return $this->belongsToMany(Cidade::class , 'cliente_cidade', 'cliente_id', 'cidade_id');
    }

    public function galeriaImagens()
    {
        return $this->hasMany(GaleriaImagem::class , 'cliente_id');
    }
}
