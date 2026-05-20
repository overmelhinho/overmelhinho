<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \App\Models\Cliente::where('nome_fantasia', 'like', '%Desentupidora%')->with('enderecos')->get(['id', 'nome_fantasia']);
echo json_encode($c, JSON_PRETTY_PRINT);
