<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false; // só created_at
    protected $table = 'audit_logs';

    protected $fillable = [
        'actor_user_id',
        'action',
        'entity_type',
        'entity_id',
        'cliente_id',
        'lead_id',
        'field_changes',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'field_changes' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Relação opcional com o User do app.
     * NÃO acessa campos específicos aqui (pra não quebrar caso schema seja diferente).
     */
    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
