<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RadarAlvoProspectado extends Model
{
    protected $table = 'radar_alvos_prospectados';

    protected $fillable = [
        'place_id',
        'nome_empresa',
        'termo',
        'cidade',
        'user_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
