<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$outliers = App\Models\Autorizacao::whereRaw("numero ~ '^[0-9]+$'")
    ->whereRaw('CAST(numero AS INTEGER) > 30000')
    ->orderBy('numero')
    ->get(['numero', 'created_at'])
    ->toArray();

echo json_encode($outliers, JSON_PRETTY_PRINT);
