<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$row = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')->where('id', 106572)->first();
print_r($row);
