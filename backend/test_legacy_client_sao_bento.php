<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$c = DB::connection('legacy')->table('clientes')->where('id', 84914)->first();
echo json_encode($c, JSON_PRETTY_PRINT);
