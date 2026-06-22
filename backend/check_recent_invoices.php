<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$invoices = \App\Models\Invoice::whereDate('created_at', '2026-06-08')->orderBy('id', 'asc')->get();
echo "Found " . $invoices->count() . " invoices created on 2026-06-08:\n";
foreach($invoices as $inv) {
    echo "ID: {$inv->id} | Client: {$inv->client_id} | Group ID: {$inv->group_id} | Parcel: {$inv->parcel_number}/{$inv->total_parcels} | Amount: {$inv->amount} | Payable: {$inv->payable_amount} | Status: {$inv->status} | Tiny ID: {$inv->tiny_account_id} | Created: {$inv->created_at}\n";
}
