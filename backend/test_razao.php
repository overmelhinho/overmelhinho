<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$legacy = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')
    ->where('pj_nome_fantasia', 'like', '%São Bento Desentupidora Ltda%')
    ->get();

echo "Found " . count($legacy) . " with name 'São Bento Desentupidora Ltda'\n";

$legacy2 = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')
    ->where('pj_razao_social', 'like', '%São Bento Desentupidora Ltda%')
    ->get();

echo "Found " . count($legacy2) . " with RAZAO 'São Bento Desentupidora Ltda'\n";
