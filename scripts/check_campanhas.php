<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%campanha%' OR table_name LIKE '%banner%' OR table_name LIKE '%publicidade%')");
echo "Tabelas encontradas:\n";
foreach ($tables as $t) {
    echo " - " . ($t->table_name ?? '') . "\n";
}

$camps = DB::table('campanhas')->get();
echo "Total de campanhas: " . count($camps) . "\n";
foreach ($camps as $c) {
    echo " - Campanha #{$c->id}: {$c->nome} (status: " . ($c->status ?? $c->ativo ?? '') . ")\n";
}

