<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Autorizacao extends Model
{
    use HasFactory;

    protected $table = 'autorizacoes';

    protected $fillable = [
        'id',
        'numero',
        'cliente_id',
        'plan_id',
        'vendedor_id',
        'tipo_publicidade',
        'titulo_anuncio',
        'descricao_anuncio',
        'valor_total',
        'taxa_cadastro',
        'data_inicio',
        'data_fim',
        'modo_pagamento',
        'num_parcelas',
        'data_primeira_parcela',
        'payment_method',
        'observacoes_anuncio',
        'observacoes_financeiro',
        'status',
        'magic_link_token',
        'assinado_em',
        'assinatura_ip',
        'assinatura_base64',
        'pdf_path',
        'is_permuta',
        'permuta_amount',
        'permuta_description',
        'desconto_tipo',
        'desconto_valor',
        'justificativa_assinatura',
        'justificado_por',
        'responsavel_nome',
        'responsavel_preferencia',
        'responsavel_turno',
        'parent_id',
        'is_bonificacao',
    ];

    protected $casts = [
        'valor_total'          => 'decimal:2',
        'taxa_cadastro'        => 'decimal:2',
        'data_inicio'          => 'date',
        'data_fim'             => 'date',
        'data_primeira_parcela'=> 'date',
        'assinado_em'          => 'datetime',
        'is_permuta'           => 'boolean',
        'permuta_amount'       => 'decimal:2',
        'desconto_valor'       => 'decimal:2',
        'is_bonificacao'       => 'boolean',
    ];

    // ─── Relacionamentos ─────────────────────────────────────────────────────

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function vendedor()
    {
        return $this->belongsTo(User::class, 'vendedor_id');
    }

    public function justificadoPor()
    {
        return $this->belongsTo(User::class, 'justificado_por');
    }

    public function parcelas()
    {
        return $this->hasMany(AutorizacaoParcela::class)->orderBy('numero');
    }

    public function parentAutorizacao()
    {
        return $this->belongsTo(Autorizacao::class, 'parent_id');
    }

    public function subAutorizacoes()
    {
        return $this->hasMany(Autorizacao::class, 'parent_id');
    }

    // ─── Accessors ───────────────────────────────────────────────────────────

    public function getValorLiquidoAttribute(): float
    {
        return (float) $this->valor_total - (float) $this->taxa_cadastro;
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'rascunho'              => 'Rascunho',
            'aguardando_assinatura' => 'Aguardando Assinatura',
            'assinado'              => 'Assinado',
            'cancelado'             => 'Cancelado',
            default                 => $this->status,
        };
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Gera o próximo número sequencial de autorização.
     */
    public static function proximoNumero(): string
    {
        $max = static::whereNull('parent_id')
            ->whereRaw("numero ~ '^[0-9]+$'")
            ->selectRaw('MAX(CAST(numero AS INTEGER)) as max_num')
            ->value('max_num');
            
        return str_pad((string) ((int) $max + 1), 5, '0', STR_PAD_LEFT);
    }
}
