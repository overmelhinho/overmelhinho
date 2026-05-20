<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$dbs = \Illuminate\Support\Facades\DB::connection('legacy')->select('SHOW DATABASES');
print_r($dbs);
