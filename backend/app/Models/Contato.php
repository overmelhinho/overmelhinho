<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contato extends Model
{
    protected $table = 'contatos';

    protected $fillable = [
        'id',
        'cliente_id',
        'telefone_principal',
        'telefone_secundario',
        'celular',
        'telefone_outro',
        'whatsapp_selected',
        'has_whatsapp_principal',
        'has_whatsapp_secundario',
        'has_whatsapp_celular',
        'has_whatsapp_outro',
        'exibir_tel_principal',
        'telefone_principal_hidden_until',
        'exibir_tel_secundario',
        'exibir_celular',
        'exibir_tel_outro',
        'exibir_email',
        'email_principal',
        'email_cobranca',
        'site',
        'nome_contato',
    ];

    protected $casts = [
        'has_whatsapp_principal'  => \App\Casts\PostgresBoolean::class,
        'has_whatsapp_secundario' => \App\Casts\PostgresBoolean::class,
        'has_whatsapp_celular'    => \App\Casts\PostgresBoolean::class,
        'has_whatsapp_outro'      => \App\Casts\PostgresBoolean::class,
        'exibir_tel_principal'             => \App\Casts\PostgresBoolean::class,
        'exibir_tel_secundario'            => \App\Casts\PostgresBoolean::class,
        'exibir_celular'                   => \App\Casts\PostgresBoolean::class,
        'exibir_tel_outro'                 => \App\Casts\PostgresBoolean::class,
        'exibir_email'                     => \App\Casts\PostgresBoolean::class,
        'telefone_principal_hidden_until'   => 'datetime',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
