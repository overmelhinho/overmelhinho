<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$activities = DB::select("
    SELECT pid, state, query, age(clock_timestamp(), query_start) as duration, wait_event_type, wait_event
    FROM pg_stat_activity 
    WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%'
    ORDER BY duration DESC
");

echo "Active queries:\n";
foreach ($activities as $act) {
    echo "PID: {$act->pid} | State: {$act->state} | Duration: {$act->duration} | Wait Event: {$act->wait_event_type} - {$act->wait_event}\n";
    echo "Query: " . substr($act->query, 0, 300) . "\n";
    echo str_repeat('-', 80) . "\n";
}
