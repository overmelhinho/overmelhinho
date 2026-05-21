<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$placeIds = [
    'ChIJ8-MAo3WhHpUR608Y0E53LTA', 
    'ChIJCQLCmGejHpURifHNSWaONEg', 
    'ChIJP5_BK-gfHJURGz-PKDCHSpo', 
    'ChIJVfsvMgAfHJURhwybaiumKzI', 
    'ChIJfQMksbijHpURsX8RVgE_zUQ', 
    'ChIJs7v8PQShHpURb28AqPcQ6-c', 
    'ChIJ5bcu1bmjHpUR_fbbI66gSkI', 
    'ChIJscbr4mmjHpURhpLdC6Ttxd4', 
    'ChIJJTsuOqkfHJURcSV-MnXK6KU', 
    'ChIJzfMuab-gHpURV_is6cEgtm0'
];

$clientes = \App\Models\Cliente::whereIn('google_place_id', $placeIds)->pluck('nome_fantasia')->toArray();
echo json_encode($clientes);
