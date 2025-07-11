<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'nome',
        'email',
        'telefone',
        'origem',
        'status',
        'responsavel',
        'observacoes'
    ];

    // Relacionamento com oportunidades (lead pode ter várias)
    public function oportunidades()
    {
        return $this->hasMany(Oportunidade::class, 'lead_id');
    }
}
