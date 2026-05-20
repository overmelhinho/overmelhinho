<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$row = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')->where('id', 106572)->first();
foreach ($row as $k => $v) {
    if (strpos($k, 'id_') !== false || strpos($k, 'end') !== false || strpos($k, 'rua') !== false || strpos($k, 'cidade') !== false) {
        echo "$k: $v\n";
    }
}
