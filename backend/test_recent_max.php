<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$numeros = App\Models\Autorizacao::whereYear('created_at', 2026)
    ->whereRaw("numero ~ '^[0-9]+$'")
    ->whereRaw('CAST(numero AS INTEGER) < 30000')
    ->orderByRaw('CAST(numero AS INTEGER) DESC')
    ->take(5)
    ->pluck('numero')
    ->toArray();

echo json_encode($numeros);
