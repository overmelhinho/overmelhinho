<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$a = \App\Models\Autorizacao::where('numero', '25917')->first();
if ($a) {
    echo "ID: " . $a->id . ", Cancelled: " . $a->tiny_needs_manual_cancellation . "\n";
    $invoices = \App\Models\Invoice::where('group_id', 'autorizacao-' . $a->id)->get();
    foreach($invoices as $i) {
        echo "Invoice {$i->id} - Status: {$i->status} - Tiny ID: {$i->tiny_account_id}\n";
    }
}
