<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$auth = \App\Models\Autorizacao::where('numero', '25918')->first();
if ($auth) {
    echo "=== AUTORIZACAO ===\n";
    echo "ID: {$auth->id} | Numero: {$auth->numero} | Status: {$auth->status} | Valor Total: {$auth->valor_total} | Num Parcelas: {$auth->num_parcelas} | Parent ID: {$auth->parent_id} | Cliente ID: {$auth->cliente_id}\n";
    
    echo "\n=== ALL AUTHORIZATIONS FOR THIS CLIENT ===\n";
    $auths = \App\Models\Autorizacao::where('cliente_id', $auth->cliente_id)->get();
    foreach($auths as $a) {
        echo "ID: {$a->id} | Numero: {$a->numero} | Status: {$a->status} | Valor Total: {$a->valor_total} | Num Parcelas: {$a->num_parcelas} | Parent ID: {$a->parent_id} | Created: {$a->created_at}\n";
    }

    echo "\n=== ALL INVOICES FOR THIS CLIENT (RECENT 10) ===\n";
    $invoices = \App\Models\Invoice::where('client_id', $auth->cliente_id)->latest('id')->limit(10)->get();
    foreach($invoices as $inv) {
        echo "ID: {$inv->id} | Group ID: {$inv->group_id} | Parcel: {$inv->parcel_number}/{$inv->total_parcels} | Amount: {$inv->amount} | Payable: {$inv->payable_amount} | Status: {$inv->status} | Tiny ID: {$inv->tiny_account_id} | Created: {$inv->created_at}\n";
    }
} else {
    echo "Not found\n";
}
