<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Verifica se existem anúncios em categorias vazias
$tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%anuncio%' OR table_name LIKE '%ad%'");
echo "Tabelas de anúncios:\n";
foreach ($tables as $t) {
    echo " - " . ($t->table_name ?? '') . "\n";
}

if (DB::getSchemaBuilder()->hasTable('anuncios')) {
    $activeAds = DB::table('anuncios')->where('status', 'ativo')->orWhere('ativo', true)->get();
    echo "\nTotal de anúncios ativos: " . count($activeAds) . "\n";
}

