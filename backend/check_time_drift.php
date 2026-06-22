<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$phpTime = now()->toDateTimeString();
$dbTime = \DB::select("SELECT NOW() as t")[0]->t;
echo "PHP Time (App): $phpTime\n";
echo "DB Time (Supabase): $dbTime\n";
