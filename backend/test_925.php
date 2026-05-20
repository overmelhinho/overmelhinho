<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$end = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->where('id', 925)->first();
print_r($end);
