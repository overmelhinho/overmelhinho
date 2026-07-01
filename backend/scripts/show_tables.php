<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = DB::connection('legacy')->select('SHOW TABLES');
foreach ($tables as $t) {
    $vals = array_values((array)$t);
    echo $vals[0] . "\n";
}
