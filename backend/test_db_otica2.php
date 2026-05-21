<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$clientes = App\Models\Cliente::pluck('nome_fantasia')->toArray();

$matches = array_filter($clientes, function($nome) {
    if (!$nome) return false;
    $hasOtica = stripos($nome, 'otica') !== false || stripos($nome, 'ótica') !== false;
    $hasFarr = stripos($nome, 'farroupilha') !== false;
    return $hasOtica && $hasFarr;
});

echo "Oticas Farroupilha in DB: \n";
print_r(array_values($matches));
