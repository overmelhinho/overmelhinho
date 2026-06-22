<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$cidades = DB::table('cidades')
    ->where('nome', 'ilike', '%Caxias%')
    ->get();

echo "Cities matching 'Caxias':\n";
foreach ($cidades as $city) {
    echo json_encode($city, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

