<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$auth = \App\Models\Autorizacao::where('numero', '25912')->first();
$invoices = \App\Models\Invoice::where('client_id', $auth->cliente_id)->get();
foreach($invoices as $i) {
    echo "ID: {$i->id}, Group: {$i->group_id}, Tiny: {$i->tiny_account_id}, Status: {$i->status}\n";
}
