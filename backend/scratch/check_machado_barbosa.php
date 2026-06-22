<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cliente;

$c = Cliente::where('nome_fantasia', 'like', '%Machado Barbosa%')->first();
if ($c) {
    echo "ID: {$c->id}\n";
    echo "Nome: {$c->nome_fantasia}\n";
    echo "Google Place ID: {$c->google_place_id}\n";
    echo "Audit Differences: " . json_encode($c->audit_differences, JSON_PRETTY_PRINT) . "\n";
    echo "Audit Status: {$c->audit_status}\n";
    echo "Last Audit At: {$c->last_audit_at}\n";
} else {
    echo "Client not found.\n";
}
