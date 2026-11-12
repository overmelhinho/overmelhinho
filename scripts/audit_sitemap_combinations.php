<?php

require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// 1. Combinacoes via cliente_cidade (atendidas)
$served = DB::table('clientes as c')
    ->join('cliente_cidade as cc', 'c.id', '=', 'cc.cliente_id')
    ->join('cidades as cid', 'cc.cidade_id', '=', 'cid.id')
    ->join('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
    ->join('segmentos as seg', 'cs.segmento_id', '=', 'seg.id')
    ->where('c.exibir_no_site', 'true')
    ->where(function ($query) {
        $query->whereIn('c.status_assinatura', ['ativa', 'ativo', 'pendente', 'inadimplente'])
              ->orWhere('c.tipo_cliente', 'gratuito');
    })
    ->select('cid.id as city_id', 'cid.nome as city_name', 'seg.id as segment_id', 'seg.nome as segment_name')
    ->distinct()
    ->get();

// 2. Combinacoes via enderecos fisicos (sediadas)
$addressed = DB::table('clientes as c')
    ->join('enderecos as e', 'c.id', '=', 'e.cliente_id')
    ->join('cidades as cid', function($join) {
        $join->on(DB::raw('LOWER(TRIM(cid.nome))'), '=', DB::raw('LOWER(TRIM(e.cidade))'));
    })
    ->join('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
    ->join('segmentos as seg', 'cs.segmento_id', '=', 'seg.id')
    ->where('c.exibir_no_site', 'true')
    ->where(function ($query) {
        $query->whereIn('c.status_assinatura', ['ativa', 'ativo', 'pendente', 'inadimplente'])
              ->orWhere('c.tipo_cliente', 'gratuito');
    })
    ->whereNotNull('e.cidade')
    ->where('e.cidade', '!=', '')
    ->select('cid.id as city_id', 'cid.nome as city_name', 'seg.id as segment_id', 'seg.nome as segment_name')
    ->distinct()
    ->get();

echo "Total combinações via cliente_cidade (atendidas): " . $served->count() . "\n";
echo "Total combinações via enderecos (sediadas): " . $addressed->count() . "\n";

$servedKeys = [];
foreach ($served as $s) {
    $servedKeys[$s->city_id . '_' . $s->segment_id] = $s->city_name . ' / ' . $s->segment_name;
}

$addressedKeys = [];
$onlyAddressed = [];
foreach ($addressed as $a) {
    $k = $a->city_id . '_' . $a->segment_id;
    $addressedKeys[$k] = $a->city_name . ' / ' . $a->segment_name;
    if (!isset($servedKeys[$k])) {
        $onlyAddressed[$k] = $a->city_name . ' / ' . $a->segment_name;
    }
}

echo "Combinações existentes APENAS via endereço físico (ausentes de activeSitemapCombinations): " . count($onlyAddressed) . "\n";
if (count($onlyAddressed) > 0) {
    echo "Exemplos de combinações ausentes:\n";
    $i = 0;
    foreach ($onlyAddressed as $k => $name) {
        echo "  - [$k] " . $name . "\n";
        if (++$i >= 15) break;
    }
}

