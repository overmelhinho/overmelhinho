<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$legacy = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')
    ->whereRaw("CONCAT_WS(' ', pj_nome_fantasia, pj_razao_social, numero, complemento) LIKE '%Carazinho%'")
    ->get();

foreach ($legacy as $l) {
    echo "ID: $l->id | Nome: $l->pj_nome_fantasia\n";
}
