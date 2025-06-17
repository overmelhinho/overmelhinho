<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'nome_fantasia', 'razao_social', 'nome_alternativo', 'cpf_cnpj',
        'inscricao_estadual', 'inscricao_municipal', 'registro_profissional',
        'descricao', 'observacoes', 'video', 'portfolio_url', 'logo_url',
        'possui_publicidade'
    ];

    public function endereco() {
        return $this->hasOne(Endereco::class);
    }

    public function contatos() {
        return $this->hasMany(Contato::class);
    }

    public function redesSociais() {
        return $this->hasMany(RedeSocial::class);
    }

    public function segmentos() {
        return $this->belongsToMany(Segmento::class, 'cliente_segmento');
    }

    public function galeriasImagens() {
        return $this->hasMany(GaleriaImagem::class);
    }
}
