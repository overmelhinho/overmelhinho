<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contato extends Model
{
    protected $table = 'contatos';

    protected $fillable = [
        'cliente_id',
        'telefone_principal',
        'telefone_secundario',
        'celular',
        'telefone_outro',
        'whatsapp_selected',
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
        'whatsapp_principal' => 'boolean',
        'whatsapp_secundario' => 'boolean',
        'exibir_tel_principal'             => 'boolean',
        'exibir_tel_secundario'            => 'boolean',
        'exibir_celular'                   => 'boolean',
        'exibir_tel_outro'                 => 'boolean',
        'exibir_email'                     => 'boolean',
        'telefone_principal_hidden_until'   => 'datetime',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
