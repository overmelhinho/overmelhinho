<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$schemas = [];
foreach(['campanhas', 'campanha_midias', 'campanha_cidades', 'campanha_segmentos', 'campanha_keywords'] as $table) {
    $schemas[$table] = DB::connection('pgsql')->select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '$table'");
}
echo json_encode($schemas, JSON_PRETTY_PRINT);
