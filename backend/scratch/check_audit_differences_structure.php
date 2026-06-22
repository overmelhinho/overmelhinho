<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cliente;

$clients = Cliente::whereNotNull('audit_differences')->limit(5)->get();

foreach ($clients as $c) {
    echo "ID: {$c->id} | Name: {$c->nome_fantasia}\n";
    echo "Audit Differences: " . json_encode($c->audit_differences, JSON_PRETTY_PRINT) . "\n\n";
}
