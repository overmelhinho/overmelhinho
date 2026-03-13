<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RadarOportunidade extends Model
{
    protected $table = 'radar_oportunidades';

    protected $fillable = [
        'termo',
        'cidade',
        'status',
        'prospectado_em',
        'user_id'
    ];

    protected $casts = [
        'prospectado_em' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
