<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cidade;

$countPagantes = Cidade::whereHas('clientes', function($c) { 
    $c->where('tipo_cliente', 'pagante')->where('exibir_no_site', true); 
})->count();

echo json_encode([
    'pagantes' => $countPagantes
]);
