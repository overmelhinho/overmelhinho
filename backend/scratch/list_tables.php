<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = DB::select("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
echo json_encode(array_column($tables, 'tablename'));
