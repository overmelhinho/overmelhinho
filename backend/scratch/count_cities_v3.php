<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cidade;

$countPublicidade = Cidade::whereHas('clientes', function($c) { 
    $c->where('possui_publicidade', true)->where('exibir_no_site', true); 
})->count();

echo json_encode([
    'publicidade' => $countPublicidade
]);
