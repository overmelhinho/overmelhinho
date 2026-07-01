<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$clientes = Cliente::where('nome_fantasia', 'like', '%Raquel Brizola%')->get();
foreach ($clientes as $cliente) {
    echo "ID: {$cliente->id}\n";
    echo "Nome: {$cliente->nome_fantasia}\n";
    echo "Tipo Cliente: {$cliente->tipo_cliente}\n";
    echo "Status Assinatura: {$cliente->status_assinatura}\n";
    echo "--------------------------\n";
}
if ($clientes->isEmpty()) {
    echo "Nenhum cliente Raquel Brizola encontrado.\n";
}
