<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Renewal extends Model
{
    protected $fillable = [
        'cliente_id',
        'expiration_date',
        'status',
        'magic_link_token',
        'suggested_changes',
    ];

    protected $casts = [
        'expiration_date' => 'date',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
