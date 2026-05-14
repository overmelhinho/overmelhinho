<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$enderecos = \App\Models\Endereco::where('cliente_id', 29)->get();
echo "ZattiVet (ID 29):\n";
foreach($enderecos as $e) {
    echo "Lat: " . $e->latitude . " Lng: " . $e->longitude . " Bairro: " . $e->bairro . "\n";
}

$enderecos2 = \App\Models\Endereco::where('cliente_id', 12)->get();
echo "Zapa (ID 12):\n";
foreach($enderecos2 as $e) {
    echo "Lat: " . $e->latitude . " Lng: " . $e->longitude . " Bairro: " . $e->bairro . "\n";
}
