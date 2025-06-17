<?php

// app/Models/Segmento.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Segmento extends Model
{
    protected $table = 'segmentos';

    protected $fillable = ['nome'];

    public function clientes() {
        return $this->belongsToMany(Cliente::class, 'cliente_segmento');
    }
}
