<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = ['clientes_corrigidos', 'exportacao_dados'];
foreach ($tables as $t) {
    echo "Table: $t\n";
    $cols = \Illuminate\Support\Facades\DB::connection('legacy')->getSchemaBuilder()->getColumnListing($t);
    print_r($cols);
}
