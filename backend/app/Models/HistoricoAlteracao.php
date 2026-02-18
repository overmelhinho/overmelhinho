<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoricoAlteracao extends Model
{
    protected $table = 'historico_alteracoes';

    public $timestamps = false;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'cliente_id',
        'usuario_id',
        'campo_alterado',
        'valor_antigo',
        'valor_novo',
        'created_at',
    ];

    protected $casts = [
        'cliente_id' => 'integer',
        'usuario_id' => 'integer',
        'created_at' => 'datetime',
    ];
}
