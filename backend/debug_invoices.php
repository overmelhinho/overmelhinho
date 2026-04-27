<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$auth = App\Models\Autorizacao::where('numero', 1196)->first();
if (!$auth) {
    echo "Auth 1196 not found.\n";
    return;
}
echo "Auth ID: {$auth->id}\n";
echo "Parcelas:\n";
print_r($auth->parcelas->toArray());
echo "Invoices:\n";
print_r(App\Models\Invoice::where('group_id', 'autorizacao-'.$auth->id)->get()->toArray());
