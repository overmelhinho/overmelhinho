<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$row = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')->where('id', 106572)->first();
$found = false;
foreach ($row as $k => $v) {
    if (is_string($v) && stripos($v, 'carazinho') !== false) {
        echo "FOUND in $k: $v\n";
        $found = true;
    }
}
if (!$found) echo "Not found in any column of clientes\n";
