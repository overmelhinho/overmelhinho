<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$campanhas = DB::table('campanhas')->get();
echo json_encode($campanhas, JSON_PRETTY_PRINT);
