<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Legacy 'empregos' table structure:\n";
$columns = DB::connection('legacy')->select("SHOW COLUMNS FROM `empregos`");
foreach($columns as $c) {
    echo "  - " . $c->Field . " (" . $c->Type . ")\n";
}

echo "\nNew 'job_opportunities' table structure:\n";
$columns = DB::connection('pgsql')->select("
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'job_opportunities'
");
foreach($columns as $c) {
    echo "  - " . $c->column_name . " (" . $c->data_type . ")\n";
}
