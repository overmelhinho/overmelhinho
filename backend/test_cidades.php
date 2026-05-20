<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = \Illuminate\Support\Facades\DB::connection('legacy')->select('SHOW TABLES');
foreach($tables as $t) {
    $var = get_object_vars($t);
    $name = reset($var);
    if (strpos($name, 'cidad') !== false || strpos($name, 'client') !== false) {
        echo $name . "\n";
    }
}
