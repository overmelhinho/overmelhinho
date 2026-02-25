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
        'exibir_tel_secundario',
        'exibir_celular',
        'exibir_tel_outro',
        'email_principal',
        'email_cobranca',
        'site',
        'nome_contato',
    ];

    protected $casts = [
        'whatsapp_principal' => 'boolean',
        'whatsapp_secundario' => 'boolean',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
