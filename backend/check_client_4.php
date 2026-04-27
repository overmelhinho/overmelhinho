<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$cliente = Cliente::with(['enderecos', 'contatos'])->find(4);
if ($cliente) {
    echo "Cliente: " . $cliente->nome_fantasia . "\n";
    echo "Endereços: " . $cliente->enderecos->count() . "\n";
    foreach ($cliente->enderecos as $e) {
        echo " - " . $e->rua . ", " . $e->numero . " - " . $e->bairro . " | " . $e->cidade . "-" . $e->estado . "\n";
    }
    echo "Contatos: " . $cliente->contatos->count() . "\n";
    echo "contact_preference: " . $cliente->contact_preference . "\n";
    echo "best_contact_shift: " . $cliente->best_contact_shift . "\n";
    echo "responsavel: " . $cliente->responsavel . "\n";
} else {
    echo "Cliente 4 não encontrado.\n";
}
