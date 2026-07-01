<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$cliente = Cliente::with('autorizacoes')->find(109059);
if ($cliente) {
    echo "ID: {$cliente->id}\n";
    echo "Nome: {$cliente->nome_fantasia}\n";
    echo "Tipo Cliente: {$cliente->tipo_cliente}\n";
    echo "Status Assinatura: {$cliente->status_assinatura}\n";
    echo "Total Autorizações: " . $cliente->autorizacoes->count() . "\n";
    foreach ($cliente->autorizacoes as $aut) {
        echo "- Aut ID: {$aut->id} | Veículo: {$aut->veiculo} | Status: {$aut->status} | Vigência: {$aut->data_inicio} a {$aut->data_fim}\n";
    }
} else {
    echo "Cliente não encontrado.\n";
}
