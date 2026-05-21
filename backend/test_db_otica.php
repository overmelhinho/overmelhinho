<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$clientes = App\Models\Cliente::whereHas('enderecos', function($q) {
    $q->where('cidade', 'ILIKE', '%farroupilha%');
})->pluck('nome_fantasia')->toArray();

$matches = array_filter($clientes, function($nome) {
    return stripos($nome, 'otica') !== false || stripos($nome, 'ótica') !== false;
});

echo "Total em Farroupilha: " . count($clientes) . "\n";
echo "Oticas: \n";
print_r(array_values($matches));
