<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$jobs = DB::table('job_opportunities')->where('title', 'like', '%E2E%')->get();
echo json_encode($jobs, JSON_PRETTY_PRINT);
