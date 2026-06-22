<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Invoice;

$invoice = Invoice::find(66662);
if ($invoice) {
    echo "Invoice 66662 details:\n";
    echo "ID: {$invoice->id}\n";
    echo "Amount: {$invoice->amount}\n";
    echo "Payable: {$invoice->payable_amount}\n";
    echo "Due Date: {$invoice->due_date?->format('d/m/Y')}\n";
    echo "Group ID: {$invoice->group_id}\n";
    echo "Status: {$invoice->status}\n";
    echo "Tiny Account ID: {$invoice->tiny_account_id}\n";
    echo "Payment Method: {$invoice->payment_method}\n";
} else {
    echo "Invoice 66662 not found locally!\n";
}
