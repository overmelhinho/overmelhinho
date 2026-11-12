<?php

require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$t0 = microtime(true);

$servedQuery = DB::table('clientes as c')
    ->join('cliente_cidade as cc', 'c.id', '=', 'cc.cliente_id')
    ->join('cidades as cid', 'cc.cidade_id', '=', 'cid.id')
    ->join('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
    ->join('segmentos as seg', 'cs.segmento_id', '=', 'seg.id')
    ->where('c.exibir_no_site', 'true')
    ->where(function ($query) {
        $query->whereIn('c.status_assinatura', ['ativa', 'ativo', 'pendente', 'inadimplente'])
              ->orWhere('c.tipo_cliente', 'gratuito');
    })
    ->select('cid.nome as city_name', 'seg.nome as segment_name');

$addressedQuery = DB::table('clientes as c')
    ->join('enderecos as e', 'c.id', '=', 'e.cliente_id')
    ->join('cidades as cid', function ($join) {
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
    ->select('cid.nome as city_name', 'seg.nome as segment_name');

$combinations = $servedQuery->union($addressedQuery)->get();
$ms = round((microtime(true) - $t0) * 1000);

echo "Total de combinações com UNION: " . $combinations->count() . " em {$ms}ms\n";

// Verificar se as 63 estão inclusas:
$floresTransporte = $combinations->first(function($c) {
    return $c->city_name === 'Flores da Cunha' && str_contains(mb_strtolower($c->segment_name), 'transporte rodoviário');
});
echo "Flores da Cunha / Transporte presente? " . ($floresTransporte ? 'SIM: ' . $floresTransporte->segment_name : 'NÃO') . "\n";

$caxiasInternet = $combinations->first(function($c) {
    return $c->city_name === 'Caxias do Sul' && str_contains(mb_strtolower($c->segment_name), 'provedor de internet');
});
echo "Caxias do Sul / Provedor de Internet presente? " . ($caxiasInternet ? 'SIM: ' . $caxiasInternet->segment_name : 'NÃO') . "\n";

$farroupilhaMetal = $combinations->first(function($c) {
    return $c->city_name === 'Farroupilha' && str_contains(mb_strtolower($c->segment_name), 'metal mecânica');
});
echo "Farroupilha / Metal Mecânica presente? " . ($farroupilhaMetal ? 'SIM: ' . $farroupilhaMetal->segment_name : 'NÃO') . "\n";

