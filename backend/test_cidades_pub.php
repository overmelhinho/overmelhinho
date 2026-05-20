<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$p = \Illuminate\Support\Facades\DB::connection('legacy')->table('publicidades')->where('id_cliente', 106572)->first();
if ($p) {
    foreach(get_object_vars($p) as $k => $v) {
        if (!empty($v) && (strpos((string)$v, ',') !== false || strpos(strtolower($k), 'cidad') !== false)) {
            echo "PUB $k => $v\n";
        }
    }
} else {
    echo "NO PUB\n";
}
