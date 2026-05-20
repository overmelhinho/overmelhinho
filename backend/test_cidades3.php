<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')->where('id', 106572)->first();
foreach(get_object_vars($c) as $k => $v) {
    if (!empty($v) && (strpos((string)$v, ',') !== false || strpos(strtolower($k), 'cidad') !== false || strlen((string)$v) > 20)) {
        echo "$k => $v\n";
    }
}
