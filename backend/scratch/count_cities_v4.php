<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cidade;

$countComEnderecoReal = Cidade::whereHas('clientes', function($c) { 
    $c->has('enderecos')->where('exibir_no_site', true); 
})->count();

echo json_encode([
    'com_endereco_real' => $countComEnderecoReal
]);
