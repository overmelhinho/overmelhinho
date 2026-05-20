<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = \Illuminate\Support\Facades\DB::connection('legacy')->select('SHOW TABLES');
$names = [];
foreach($tables as $t) {
    $var = get_object_vars($t);
    $names[] = reset($var);
}
print_r($names);
