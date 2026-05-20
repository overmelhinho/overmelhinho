<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = DB::connection('legacy')->select('SHOW TABLES');
foreach($tables as $t) {
    $tableName = ((array)$t)['Tables_in_overmelhinho'];
    $cols = DB::connection('legacy')->getSchemaBuilder()->getColumnListing($tableName);
    if (in_array('id_segmento', $cols)) {
        echo "Found in $tableName\n";
    }
}
