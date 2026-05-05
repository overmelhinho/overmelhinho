<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Endereco extends Model
{
    protected $table = 'enderecos';

    protected $fillable = [
        'cliente_id',
        'nome_unidade',
        'telefone',
        'cep',
        'estado',
        'cidade',
        'bairro',
        'rua',
        'numero',
        'endereco_compacto',
        'complemento',
        'caixa_postal',
        'link_maps',
        'link_waze',
        'iframe_maps',
        'exibir_apenas_cidade',
        'is_cobranca',
    ];

    protected $casts = [
        'exibir_apenas_cidade' => 'boolean',
        'is_cobranca' => 'boolean',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
