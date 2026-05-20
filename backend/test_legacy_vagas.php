<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = DB::connection('legacy')->select('SHOW TABLES');
echo "Legacy Tables related to vagas/emprego:\n";
foreach($tables as $t) {
    $arr = (array)$t;
    $name = array_values($arr)[0];
    if(str_contains(strtolower($name), 'vaga') || str_contains(strtolower($name), 'emprego')) {
        echo $name . "\n";
        $columns = DB::connection('legacy')->select("SHOW COLUMNS FROM `$name`");
        foreach($columns as $c) {
            echo "  - " . $c->Field . " (" . $c->Type . ")\n";
        }
        echo "\n";
    }
}
