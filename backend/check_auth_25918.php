<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$auth = \App\Models\Autorizacao::where('numero', '25918')->first();
if (!$auth) {
    // try with prefix or substring
    $auth = \App\Models\Autorizacao::where('numero', 'like', '%25918%')->first();
}

if (!$auth) {
    echo "Auth 25918 not found.\n";
    exit;
}

echo "Auth Local ID: " . $auth->id . " | Numero: " . $auth->numero . " | Status: " . $auth->status . " | Valor Total: " . $auth->valor_total . " | Num Parcelas: " . $auth->num_parcelas . "\n";

$invoices = \App\Models\Invoice::where('group_id', 'autorizacao-' . $auth->id)->get();
echo "Found " . $invoices->count() . " invoices locally for group_id autorizacao-{$auth->id}.\n";
foreach($invoices as $inv) {
    echo "Local Invoice ID: {$inv->id} | Parcel: {$inv->parcel_number} | Amount: {$inv->amount} | Payable: {$inv->payable_amount} | Status: {$inv->status} | Tiny ID: {$inv->tiny_account_id} | Created: {$inv->created_at}\n";
}

$allInvoicesForClient = \App\Models\Invoice::where('client_id', $auth->cliente_id)->get();
echo "\nAll Invoices for client:\n";
foreach($allInvoicesForClient as $inv) {
    echo "Invoice ID: {$inv->id} | Group ID: {$inv->group_id} | Parcel: {$inv->parcel_number}/{$inv->total_parcels} | Amount: {$inv->amount} | Payable: {$inv->payable_amount} | Status: {$inv->status} | Tiny ID: {$inv->tiny_account_id} | Created: {$inv->created_at}\n";
}
