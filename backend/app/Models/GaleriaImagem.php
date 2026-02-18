<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GaleriaImagem extends Model
{
    protected $table = 'galerias_imagens';
    public $timestamps = false; // pq só tem created_at, não tem updated_at

    protected $fillable = [
        'cliente_id',
        'url',
        'thumb_url',
        'legenda',
        'ordem',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
