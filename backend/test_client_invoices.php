<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Invoice;

$invoices = Invoice::where('client_id', 106572)->orderBy('id', 'desc')->get();
echo "Total invoices for client 105572: " . $invoices->count() . "\n";
foreach ($invoices as $i) {
    echo "ID: {$i->id}, Amount: {$i->amount}, Payable: {$i->payable_amount}, Due: {$i->due_date?->format('d/m/Y')}, Group: {$i->group_id}, Tiny ID: {$i->tiny_account_id}, Status: {$i->status}, Method: {$i->payment_method}\n";
}
