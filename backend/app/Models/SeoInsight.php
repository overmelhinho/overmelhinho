<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeoInsight extends Model
{
    protected $fillable = [
        'cliente_id',
        'keyword',
        'url',
        'insight_type',
        'position',
        'impressions',
        'clicks',
        'ctr',
        'status',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
}
