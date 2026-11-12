<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$barao = DB::table('cidades')->whereRaw("f_unaccent(LOWER(nome)) = 'barao'")->get();
echo "Cidades com nome Barão:\n";
foreach ($barao as $b) {
    echo "ID: {$b->id}, Nome: {$b->nome}, UF: " . ($b->uf ?? '') . "\n";
}

$prodCaseiros = DB::table('segmentos')->whereRaw("f_unaccent(LOWER(nome)) LIKE '%produtos caseiros%'")->get();
echo "\nSegmentos com 'Produtos Caseiros':\n";
foreach ($prodCaseiros as $p) {
    echo "ID: {$p->id}, Nome: {$p->nome}, Slug: {$p->slug}\n";
}

echo "\nClientes vinculados a Barão:\n";
foreach ($barao as $b) {
    $clientsByCity = DB::table('clientes as c')
        ->join('cliente_cidade as cc', 'c.id', '=', 'cc.cliente_id')
        ->leftJoin('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
        ->leftJoin('segmentos as s', 'cs.segmento_id', '=', 's.id')
        ->where('cc.cidade_id', $b->id)
        ->select('c.id', 'c.nome_fantasia', 'c.exibir_no_site', 'c.tipo_cliente', 'c.status_assinatura', 's.id as seg_id', 's.nome as seg_nome')
        ->get();
    echo "Cidade ID {$b->id} ({$b->nome}) tem " . count($clientsByCity) . " vínculos:\n";
    foreach ($clientsByCity as $cl) {
        echo " - Cliente #{$cl->id} [{$cl->nome_fantasia}] (exibir: {$cl->exibir_no_site}, tipo: {$cl->tipo_cliente}, status: {$cl->status_assinatura}) -> Seg #{$cl->seg_id}: {$cl->seg_nome}\n";
    }

    $clientsByAddress = DB::table('clientes as c')
        ->join('enderecos as e', 'c.id', '=', 'e.cliente_id')
        ->leftJoin('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
        ->leftJoin('segmentos as s', 'cs.segmento_id', '=', 's.id')
        ->whereRaw("f_unaccent(LOWER(e.cidade)) = 'barao'")
        ->select('c.id', 'c.nome_fantasia', 'c.exibir_no_site', 'c.tipo_cliente', 'c.status_assinatura', 'e.cidade as end_cidade', 's.id as seg_id', 's.nome as seg_nome')
        ->get();
    echo "Endereço em Barão: " . count($clientsByAddress) . " vínculos:\n";
    foreach ($clientsByAddress as $cl) {
        echo " - Cliente #{$cl->id} [{$cl->nome_fantasia}] (exibir: {$cl->exibir_no_site}, tipo: {$cl->tipo_cliente}, status: {$cl->status_assinatura}) -> Seg #{$cl->seg_id}: {$cl->seg_nome}\n";
    }
}
