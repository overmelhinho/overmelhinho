<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Mostra cidades e estados dos endereços
$rows = DB::table('enderecos')
    ->select('cidade', 'estado', 'cep', 'bairro', 'latitude', 'longitude')
    ->whereNotNull('cidade')
    ->limit(15)
    ->get();

foreach ($rows as $row) {
    echo "Cidade: {$row->cidade} | Estado: {$row->estado} | CEP: {$row->cep} | Bairro: {$row->bairro} | lat: {$row->latitude} | lng: {$row->longitude}\n";
}
