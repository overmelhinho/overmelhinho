<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$t = DB::connection('legacy')->select("SHOW TABLES LIKE '%endereco%'");
echo json_encode($t, JSON_PRETTY_PRINT);
