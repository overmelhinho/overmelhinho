<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketSubtask extends Model
{
    protected $fillable = [
        'ticket_id',
        'title',
        'is_completed',
        'completed_at',
        'completed_by',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class , 'completed_by');
    }
}
