<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$enderecos = \App\Models\Endereco::where('cliente_id', 17503)->get();
echo json_encode($enderecos->toArray(), JSON_PRETTY_PRINT);
