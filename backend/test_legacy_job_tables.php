<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = DB::connection('legacy')->select("SHOW TABLES");
$filtered = array_filter($tables, function($t) {
    $val = array_values((array)$t)[0];
    return str_contains($val, 'empreg') || str_contains($val, 'vaga');
});
echo json_encode(array_values($filtered), JSON_PRETTY_PRINT);
