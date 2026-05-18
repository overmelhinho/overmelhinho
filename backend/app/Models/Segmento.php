<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Segmento extends Model
{
    protected $fillable = ['id', 'nome', 'slug', 'descricao'];

    protected static function booted()
    {
        static::saving(function ($segmento) {
            if (empty($segmento->slug) && !empty($segmento->nome)) {
                $segmento->slug = \App\Services\SlugService::create($segmento->nome);
            }
        });
    }
}
