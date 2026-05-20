<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$columns = DB::connection('legacy')->select("SHOW COLUMNS FROM publicidades");
$filtered = array_filter($columns, function($c) {
    return str_contains(strtolower($c->Field), 'imagem') || str_contains(strtolower($c->Field), 'banner') || str_contains(strtolower($c->Field), 'arquivo');
});
echo json_encode(array_values($filtered), JSON_PRETTY_PRINT);
