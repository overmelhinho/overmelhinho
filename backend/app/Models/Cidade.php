<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cidade extends Model
{
    use HasFactory;

    protected $table = 'cidades';

    protected $fillable = [
        'id',
        'nome',
        'uf',
    ];

    public function clientes()
    {
        return $this->belongsToMany(Cliente::class, 'cliente_cidade', 'cidade_id', 'cliente_id');
    }
}
