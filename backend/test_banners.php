<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$rows = DB::connection('legacy')->table('publicidades')
    ->whereNotNull('arquivo_banner2')
    ->where('arquivo_banner2', '!=', '')
    ->limit(3)
    ->get(['arquivo_banner', 'arquivo_banner2', 'banner_cidades', 'banner_keywords', 'banner_id_categorias']);
echo json_encode($rows, JSON_PRETTY_PRINT);
