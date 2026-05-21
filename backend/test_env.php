<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "DB connection: " . env('DB_CONNECTION') . "\n";
echo "Host: " . env('DB_HOST') . "\n";
