<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$columns = DB::connection('legacy')->select("SHOW COLUMNS FROM `popup`");
foreach($columns as $c) {
    echo $c->Field . " (" . $c->Type . ")\n";
}

$first = DB::connection('legacy')->select("SELECT * FROM `popup` LIMIT 1");
print_r($first);
