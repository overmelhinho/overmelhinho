<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;
use App\Models\Endereco;

$cliente = Cliente::where('nome_fantasia', 'like', '%Fernanda Neis%')->first();
if ($cliente) {
    echo "Cliente: {$cliente->nome_fantasia}\n";
    foreach ($cliente->enderecos as $end) {
        echo "Endereço: Rua {$end->rua}, {$end->numero} - {$end->complemento}\n";
        echo "Bairro: {$end->bairro} | Cidade: {$end->cidade} - {$end->estado} | CEP: {$end->cep}\n";
    }
} else {
    echo "Cliente não encontrado.\n";
}
