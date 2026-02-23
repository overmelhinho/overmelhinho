<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeoRanking extends Model
{
    protected $fillable = [
        'cliente_id',
        'keyword',
        'position',
        'previous_position',
        'clicks',
        'impressions',
        'ctr',
        'checked_at'
    ];

    protected $casts = [
        'checked_at' => 'datetime',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
