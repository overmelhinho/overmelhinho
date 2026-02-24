<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientInteraction extends Model
{
    protected $fillable = [
        'cliente_id',
        'interaction_type'
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
