<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $table = 'tickets';

    protected $fillable = [
        'cliente_id',
        'created_by',
        'assignee_id',
        'setor',
        'tipo',
        'status',
        'titulo',
        'descricao',
        'prioridade',
        'due_at',
        'resolved_at',
        'closed_at',
        'meta',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'meta' => 'array',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function logs()
    {
        return $this->hasMany(TicketLog::class, 'ticket_id')->orderBy('id', 'desc');
    }
}
