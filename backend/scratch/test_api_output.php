<?php

use App\Models\Invoice;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$inv = Invoice::find(66128);
if ($inv) {
    echo "Fatura ID: {$inv->id}\n";
    echo "tiny_account_id no Banco: " . var_export($inv->tiny_account_id, true) . "\n";
    echo "JSON Output:\n";
    echo json_encode($inv->toArray(), JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Fatura 66128 não encontrada!\n";
}
