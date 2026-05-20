<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$log = \Illuminate\Support\Facades\DB::connection('legacy')->table('logradouros')->where('id', 5)->first();
print_r($log);
