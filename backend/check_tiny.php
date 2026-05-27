<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$auth = \App\Models\Autorizacao::where('numero', '25916')->first();
if (!$auth) {
    echo "Auth 25916 not found.\n";
    exit;
}

echo "Auth Local ID: " . $auth->id . "\n";

$invoices = \App\Models\Invoice::where('group_id', 'autorizacao-' . $auth->id)->get();
echo "Found " . $invoices->count() . " invoices locally.\n";

$tinyService = app(\App\Services\TinyErpService::class);

foreach($invoices as $inv) {
    echo "Local Invoice ID: {$inv->id} | Parcel: {$inv->parcel_number} | Tiny ID: {$inv->tiny_account_id}\n";
    if ($inv->tiny_account_id) {
        $status = $tinyService->getReceivableStatus($inv->tiny_account_id);
        if ($status) {
            echo "   -> Tiny Status: " . json_encode($status) . "\n";
        } else {
            echo "   -> Tiny Status: NOT FOUND IN TINY\n";
        }
    }
}
