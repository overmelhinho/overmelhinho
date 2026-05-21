<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$max = App\Models\Autorizacao::whereNull('parent_id')
    ->whereRaw("numero ~ '^[0-9]+$'")
    ->selectRaw('MAX(CAST(numero AS INTEGER)) as max_num')
    ->value('max_num');

echo "MAX: $max\n";
