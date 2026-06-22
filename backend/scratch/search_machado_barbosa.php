<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cliente;

$clients = Cliente::where('nome_fantasia', 'like', '%Machado%')
    ->where('nome_fantasia', 'like', '%Barbosa%')
    ->get();

foreach ($clients as $c) {
    echo "ID: {$c->id}\n";
    echo "Nome: {$c->nome_fantasia}\n";
    echo "Google Place ID: '{$c->google_place_id}'\n";
    echo "Audit Status: '{$c->audit_status}'\n";
    echo "Audit Differences: " . json_encode($c->audit_differences) . "\n";
    echo "-------------------\n";
}
