<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cidade;

$countPagantes = Cidade::whereHas('clientes', function($c) { 
    $c->where('tipo_cliente', 'PAGANTE')->where('exibir_no_site', true); 
})->count();

$countComEndereco = Cidade::whereIn('nome', \App\Models\Endereco::distinct('cidade')->pluck('cidade'))->count();

$countTotalAtivos = Cidade::whereHas('clientes', function($c) { 
    $c->where('exibir_no_site', true); 
})->count();

echo json_encode([
    'pagantes' => $countPagantes,
    'com_endereco' => $countComEndereco,
    'total_ativos' => $countTotalAtivos
]);
