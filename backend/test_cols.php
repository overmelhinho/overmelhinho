<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cols1 = DB::connection('legacy')->getSchemaBuilder()->getColumnListing('publicidades_parcelas');
print_r($cols1);

$cols2 = DB::connection('legacy')->getSchemaBuilder()->getColumnListing('publicidades_parcelas_pagamentos');
print_r($cols2);

$pagamentos = DB::connection('legacy')->table('publicidades_parcelas_pagamentos')->limit(5)->get();
print_r($pagamentos);
