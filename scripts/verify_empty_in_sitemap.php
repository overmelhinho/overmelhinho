<?php

require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Consulta atual de activeSitemapCombinations
$combos = DB::table('clientes as c')
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

echo "Total de combinações geradas atualmente: " . $combos->count() . "\n";

// Verificar se alguma delas tem 0 empresas ativas considerando as regras de indexPublic
$emptyCount = 0;
$sampleEmpty = [];

foreach ($combos as $combo) {
    $count = DB::table('clientes as c')
        ->where('c.exibir_no_site', 'true')
        ->where(function ($query) {
            $query->whereIn('c.status_assinatura', ['ativa', 'ativo', 'pendente', 'inadimplente'])
                  ->orWhere('c.tipo_cliente', 'gratuito');
        })
        ->where(function ($q) use ($combo) {
            $q->whereExists(function ($sub) use ($combo) {
                $sub->select(DB::raw(1))
                    ->from('cliente_cidade')
                    ->whereColumn('cliente_cidade.cliente_id', 'c.id')
                    ->where('cliente_cidade.cidade_id', $combo->city_id);
            })->orWhereExists(function ($sub) use ($combo) {
                $sub->select(DB::raw(1))
                    ->from('enderecos')
                    ->whereColumn('enderecos.cliente_id', 'c.id')
                    ->whereRaw('LOWER(TRIM(enderecos.cidade)) = ?', [mb_strtolower(trim($combo->city_name))]);
            });
        })
        ->whereExists(function ($sub) use ($combo) {
            $sub->select(DB::raw(1))
                ->from('cliente_segmento')
                ->whereColumn('cliente_segmento.cliente_id', 'c.id')
                ->where('cliente_segmento.segmento_id', $combo->segment_id);
        })
        ->count();

    if ($count === 0) {
        $emptyCount++;
        $sampleEmpty[] = "{$combo->city_name} / {$combo->segment_name}";
    }
}

echo "Combinações com ZERO empresas ativas: $emptyCount\n";
if ($emptyCount > 0) {
    echo "Exemplos vazios:\n";
    foreach (array_slice($sampleEmpty, 0, 10) as $e) {
        echo "  - $e\n";
    }
}

