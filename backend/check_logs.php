<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$logs = \App\Models\AuditLog::where('action', 'ilike', '%audit%')
    ->whereDate('created_at', '>=', '2026-04-26')
    ->whereDate('created_at', '<=', '2026-05-26')
    ->with('cliente')
    ->get();

foreach($logs as $log) {
    echo $log->id . ' - Cliente ID: ' . $log->cliente_id . ' | Cliente existe: ' . ($log->cliente ? 'SIM' : 'NAO') . PHP_EOL;
}
