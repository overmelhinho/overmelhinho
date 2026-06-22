<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$clients = Cliente::orderBy('id', 'desc')->limit(10)->get();
foreach ($clients as $c) {
    echo "ID: {$c->id}, Nome: {$c->nome_fantasia}, Created: {$c->created_at}\n";
}
