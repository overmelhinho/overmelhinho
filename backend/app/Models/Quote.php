<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'cliente_id',
        'customer_name',
        'customer_whatsapp',
        'service_requested',
        'urgency',
        'status',
        'ai_draft_response',
        'notified_at',
    ];

    protected $casts = [
        'notified_at' => 'datetime',
    ];

    /**
     * Relacionamento com o Cliente (O Lojista)
     */
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
