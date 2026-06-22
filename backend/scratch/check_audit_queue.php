<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cliente;

$ids = [3, 4, 5, 7, 8, 9, 10, 13, 38836, 38837];
$clients = Cliente::whereIn('id', $ids)->get();

foreach ($clients as $c) {
    echo "ID: {$c->id} | Name: {$c->nome_fantasia} | Status: {$c->audit_status}\n";
}
