<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$today = \Carbon\Carbon::today()->format('Y-m-d');
$twoMonthsAgo = now()->subMonths(2)->format('Y-m-d');

$inadimplentesClientIds = \Illuminate\Support\Facades\DB::table('invoices')
    ->select('client_id')
    ->where('status', 'pending')
    ->where('due_date', '<', $today)
    ->groupBy('client_id')
    ->havingRaw('COUNT(*) >= 2 OR MIN(due_date) <= ?', [$twoMonthsAgo])
    ->pluck('client_id')
    ->toArray();

echo "Today: $today\n";
echo "Two Months Ago: $twoMonthsAgo\n";
echo "Is 115780 in list? " . (in_array(115780, $inadimplentesClientIds) ? 'YES' : 'NO') . "\n";
