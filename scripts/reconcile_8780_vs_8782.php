<?php

require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Query 1: by (city_id, segment_id)
$served1 = DB::table('clientes as c')
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

$addressed1 = DB::table('clientes as c')
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

$byIds = [];
foreach ($served1 as $r) {
    $byIds[$r->city_id . '_' . $r->segment_id] = [
        'city_id' => $r->city_id,
        'city_name' => $r->city_name,
        'segment_id' => $r->segment_id,
        'segment_name' => $r->segment_name,
    ];
}
foreach ($addressed1 as $r) {
    $byIds[$r->city_id . '_' . $r->segment_id] = [
        'city_id' => $r->city_id,
        'city_name' => $r->city_name,
        'segment_id' => $r->segment_id,
        'segment_name' => $r->segment_name,
    ];
}

echo "Total distinct (city_id, segment_id): " . count($byIds) . "\n";

// Query 2: by (city_name, segment_name) as used in activeSitemapCombinations
$byNames = [];
$nameToIds = [];
foreach ($byIds as $k => $item) {
    $nameKey = mb_strtolower(trim($item['city_name'])) . '|||' . mb_strtolower(trim($item['segment_name']));
    $byNames[$nameKey][] = $item;
}

echo "Total distinct (city_name, segment_name): " . count($byNames) . "\n";

echo "\n--- DIVERGÊNCIAS (onde um par de nomes possui múltiplos IDs) ---\n";
foreach ($byNames as $nameKey => $items) {
    if (count($items) > 1) {
        echo "Chave de nome: '$nameKey' (ocorrências: " . count($items) . "):\n";
        foreach ($items as $it) {
            echo "   -> city_id: {$it['city_id']} ({$it['city_name']}) | segment_id: {$it['segment_id']} ({$it['segment_name']})\n";
        }
    }
}

