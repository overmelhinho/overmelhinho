<?php

require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Farroupilha city_id = 1
$farroupilhaCats = DB::table('clientes as c')
    ->join('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
    ->join('segmentos as s', 'cs.segmento_id', '=', 's.id')
    ->where('c.exibir_no_site', 'true')
    ->where(function ($q) {
        $q->whereIn('c.status_assinatura', ['ativa', 'ativo', 'pendente', 'inadimplente'])
          ->orWhere('c.tipo_cliente', 'gratuito');
    })
    ->where(function ($q) {
        $q->whereExists(function ($sub) {
            $sub->select(DB::raw(1))->from('cliente_cidade')->whereColumn('cliente_cidade.cliente_id', 'c.id')->where('cliente_cidade.cidade_id', 1);
        })->orWhereExists(function ($sub) {
            $sub->select(DB::raw(1))->from('enderecos')->whereColumn('enderecos.cliente_id', 'c.id')->whereRaw('LOWER(TRIM(enderecos.cidade)) = ?', ['farroupilha']);
        });
    })
    ->where(function ($q) {
        $q->where('s.nome', 'ilike', '%saude%')
          ->orWhere('s.nome', 'ilike', '%farmac%')
          ->orWhere('s.nome', 'ilike', '%medic%')
          ->orWhere('s.nome', 'ilike', '%odont%');
    })
    ->select('s.id', 's.nome', DB::raw('count(c.id) as total'))
    ->groupBy('s.id', 's.nome')
    ->orderByDesc('total')
    ->get();

echo "Categorias de saude em Farroupilha:\n";
foreach ($farroupilhaCats as $fc) {
    $slug = \Illuminate\Support\Str::slug($fc->nome);
    echo "  - [{$fc->id}] {$fc->nome}: {$fc->total} empresas (slug: {$slug})\n";
}

// Bento Gonçalves city_id = 2
$bentoCats = DB::table('clientes as c')
    ->join('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
    ->join('segmentos as s', 'cs.segmento_id', '=', 's.id')
    ->where('c.exibir_no_site', 'true')
    ->where(function ($q) {
        $q->whereIn('c.status_assinatura', ['ativa', 'ativo', 'pendente', 'inadimplente'])
          ->orWhere('c.tipo_cliente', 'gratuito');
    })
    ->where(function ($q) {
        $q->whereExists(function ($sub) {
            $sub->select(DB::raw(1))->from('cliente_cidade')->whereColumn('cliente_cidade.cliente_id', 'c.id')->where('cliente_cidade.cidade_id', 2);
        })->orWhereExists(function ($sub) {
            $sub->select(DB::raw(1))->from('enderecos')->whereColumn('enderecos.cliente_id', 'c.id')->whereRaw('LOWER(TRIM(enderecos.cidade)) = ?', ['bento goncalves']);
        });
    })
    ->where(function ($q) {
        $q->where('s.nome', 'ilike', '%restaurante%')
          ->orWhere('s.nome', 'ilike', '%gastro%')
          ->orWhere('s.nome', 'ilike', '%aliment%');
    })
    ->select('s.id', 's.nome', DB::raw('count(c.id) as total'))
    ->groupBy('s.id', 's.nome')
    ->orderByDesc('total')
    ->get();

echo "\nCategorias de gastronomia em Bento:\n";
foreach ($bentoCats as $bc) {
    $slug = \Illuminate\Support\Str::slug($bc->nome);
    echo "  - [{$bc->id}] {$bc->nome}: {$bc->total} empresas (slug: {$slug})\n";
}

echo "\nTop categorias em Farroupilha:\n";
$topFarroupilha = DB::table('clientes as c')
    ->join('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
    ->join('segmentos as s', 'cs.segmento_id', '=', 's.id')
    ->where('c.exibir_no_site', 'true')
    ->where(function ($q) {
        $q->whereIn('c.status_assinatura', ['ativa', 'ativo', 'pendente', 'inadimplente'])
          ->orWhere('c.tipo_cliente', 'gratuito');
    })
    ->where(function ($q) {
        $q->whereExists(function ($sub) {
            $sub->select(DB::raw(1))->from('cliente_cidade')->whereColumn('cliente_cidade.cliente_id', 'c.id')->where('cliente_cidade.cidade_id', 1);
        })->orWhereExists(function ($sub) {
            $sub->select(DB::raw(1))->from('enderecos')->whereColumn('enderecos.cliente_id', 'c.id')->whereRaw('LOWER(TRIM(enderecos.cidade)) = ?', ['farroupilha']);
        });
    })
    ->select('s.id', 's.nome', DB::raw('count(c.id) as total'))
    ->groupBy('s.id', 's.nome')
    ->orderByDesc('total')
    ->limit(10)
    ->get();

foreach ($topFarroupilha as $t) {
    $slug = \Illuminate\Support\Str::slug($t->nome);
    echo "  - [{$t->id}] {$t->nome}: {$t->total} empresas (slug: {$slug})\n";
}
