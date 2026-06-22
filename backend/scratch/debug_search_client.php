<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$clients = Cliente::where('nome_fantasia', 'LIKE', '%E2E%')
    ->orWhere('nome_fantasia', 'LIKE', '%Robot%')
    ->get();

echo "Found " . $clients->count() . " clients matching search.\n";
foreach ($clients as $c) {
    echo "ID: {$c->id}, Nome: {$c->nome_fantasia}\n";
}
