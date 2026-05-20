<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$m = DB::connection('pgsql')->select("SELECT desktop_url FROM campanha_midias WHERE desktop_url IS NOT NULL AND desktop_url NOT LIKE '/storage/midias/popups/%' LIMIT 5");
echo json_encode($m, JSON_PRETTY_PRINT);
