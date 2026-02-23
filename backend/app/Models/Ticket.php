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

    protected $appends = ['sla_status'];

    public function getSlaStatusAttribute()
    {
        if (!$this->due_at || in_array($this->status, ['resolvido', 'concluido', 'fechado', 'closed', 'cancelado', 'canceled'])) {
            return 'completed';
        }

        $now = now();
        if ($now->greaterThan($this->due_at)) {
            return 'overdue';
        }

        if ($now->diffInHours($this->due_at) <= 24) {
            return 'warning';
        }

        return 'normal';
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class , 'cliente_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class , 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class , 'assignee_id');
    }

    public function subtasks()
    {
        return $this->hasMany(TicketSubtask::class , 'ticket_id')->orderBy('id', 'asc');
    }

    public function logs()
    {
        return $this->hasMany(TicketLog::class , 'ticket_id')->orderBy('id', 'desc');
    }
}
