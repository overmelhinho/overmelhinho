<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$columns = DB::connection('legacy')->getSchemaBuilder()->getColumnListing('clientes');
print_r($columns);

$legacy = DB::connection('legacy')->table('clientes')->where('id', 69440)->first();
print_r($legacy);
