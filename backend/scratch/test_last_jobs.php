<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$jobs = DB::table('job_opportunities')->orderBy('id', 'desc')->limit(5)->get();
echo json_encode($jobs, JSON_PRETTY_PRINT);
