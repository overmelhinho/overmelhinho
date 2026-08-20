<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\Auditable;

class Cliente extends Model
{
    use Auditable;
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected static function booted()
    {
        static::saving(function ($cliente) {
            // Extract the src URL from an iframe if provided
            if (!empty($cliente->video) && str_contains($cliente->video, '<iframe')) {
                if (preg_match('/src=["\']([^"\']+)["\']/', $cliente->video, $matches)) {
                    $cliente->video = $matches[1];
                }
            }

            if (empty($cliente->slug) && !empty($cliente->nome_fantasia)) {
                // Gera o slug altamente sanitizado
                $originalSlug = \App\Services\SlugService::create($cliente->nome_fantasia);
                $slug = $originalSlug;
                
                // Garante que o slug seja único verificando a existência
                $counter = 1;
                while (static::where('slug', $slug)->where('id', '<>', $cliente->id)->exists()) {
                    $slug = $originalSlug . '-' . $counter;
                    $counter++;
                }
                
                $cliente->slug = $slug;
            }
        });

        static::saved(function ($cliente) {
            $cliente->syncSearchVector();
        });
    }

    public function syncSearchVector(): void
    {
        $text = collect([
            $this->nome_fantasia,
            $this->nome_alternativo,
            is_array($this->seo_keywords) ? implode(' ', $this->seo_keywords) : $this->seo_keywords,
            $this->segmentos()->pluck('nome')->implode(' ')
        ])->filter()->join(' ');

        $text = \Illuminate\Support\Str::ascii($text);
        
        \Illuminate\Support\Facades\DB::statement(
            'UPDATE clientes SET search_vector = to_tsvector(\'portuguese\', ?) WHERE id = ?',
            [$text, $this->id]
        );
    }

    protected string $auditEntityType = 'cliente';

    // opcional (recomendado)
    protected array $auditIgnore = [
        'seo_keywords_updated_at',
    ];

    protected $table = 'clientes';

    protected $fillable = [
        'id',
        'nome_fantasia',
        'slug',
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
        'banner_url',
        'possui_publicidade',
        'seo_keywords',
        'seo_keywords_source',
        'seo_keywords_updated_at',
        'seo_title',
        'seo_description',
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
        'observacoes_horario',
        'is_horario_marcado',
        'google_place_id',
        'data_fundacao',
        'tipo_arquivo_midia',
        'last_audit_at',
        'audit_status',
        'exibir_no_site',
        'exibir_data_fundacao',
        'audit_differences',
        'responsavel',
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
        'possui_publicidade' => \App\Casts\PostgresBoolean::class,
        'exibir_no_site' => \App\Casts\PostgresBoolean::class,
        'seo_keywords' => 'array',
        'beneficios' => 'array',
        'horario_atendimento' => 'array',
        'seo_keywords_updated_at' => 'datetime',
        'contract_ends_at' => 'date',
        'data_fundacao' => 'date',
        'exibir_data_fundacao' => \App\Casts\PostgresBoolean::class,
        'last_audit_at' => 'datetime',
        'audit_differences' => 'array',
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
        return $this->belongsToMany(Segmento::class , 'cliente_segmento', 'cliente_id', 'segmento_id')
                    ->withPivot('is_primary')
                    ->orderByDesc('cliente_segmento.is_primary');
    }

    public function cidadesAtendidas()
    {
        return $this->belongsToMany(Cidade::class , 'cliente_cidade', 'cliente_id', 'cidade_id');
    }

    public function galeriaImagens()
    {
        return $this->hasMany(GaleriaImagem::class , 'cliente_id')
                    ->orderBy('ordem', 'asc');
    }

    public function interacoes()
    {
        return $this->hasMany(ClientInteraction::class, 'cliente_id');
    }

    public function reviews()
    {
        return $this->hasMany(ClienteReview::class, 'cliente_id');
    }

    public function jobOpportunities()
    {
        return $this->hasMany(JobOpportunity::class, 'client_id');
    }

    public function autorizacoes()
    {
        return $this->hasMany(Autorizacao::class, 'cliente_id');
    }
}
