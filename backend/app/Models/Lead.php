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
        'lost_at',
        'motivo_perda',
        'google_place_id',
        'referencia',
        'endereco',
        'interesse',
        'cidade',
    ];

    protected $fillable = [
        'nome',
        'email',
        'telefone',
        'origem',
        'status',
        'responsavel',
        'observacoes',
        'data_follow_up',
        'lost_at',
        'motivo_perda',
        'google_place_id',
        'referencia',
        'endereco',
        'interesse',
        'cidade',
        'foto_fachada',
    ];

    protected $casts = [
        'lost_at' => 'datetime',
    ];

    // Relacionamento com oportunidades (lead pode ter várias)
    public function oportunidades()
    {
        return $this->hasMany(Oportunidade::class , 'lead_id');
    }
}
