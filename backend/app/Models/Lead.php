<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\Auditable;

class Lead extends Model
{
    use Auditable;

    protected string $auditEntityType = 'lead';

    /**
     * (Opcional, recomendado)
     * Lista de campos que entram no diff do histórico.
     * Assim você evita logar campos técnicos/campos futuros sem querer.
     */
    protected array $auditInclude = [
        'nome',
        'email',
        'telefone',
        'origem',
        'status',
        'responsavel',
        'observacoes',
        'data_follow_up',
    ];

    protected $fillable = [
        'nome',
        'email',
        'telefone',
        'origem',
        'status',
        'responsavel',
        'observacoes',
        'data_follow_up'
    ];

    // Relacionamento com oportunidades (lead pode ter várias)
    public function oportunidades()
    {
        return $this->hasMany(Oportunidade::class, 'lead_id');
    }
}
