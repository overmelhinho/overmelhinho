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
        'whatsapp_principal',
        'whatsapp_secundario',
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
