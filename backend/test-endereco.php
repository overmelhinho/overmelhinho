<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;
use Illuminate\Support\Facades\DB;

$nome = 'J P Manutenções';
$cliente = Cliente::where('nome_fantasia', 'like', "%{$nome}%")->first();

if (!$cliente) {
    echo "Cliente não encontrado no DB novo.\n";
    exit;
}

echo "Cliente ID: {$cliente->id}\n";
echo "Nome: {$cliente->nome_fantasia}\n";

// Endereço no banco novo
$enderecos = $cliente->enderecos;
echo "\n--- Endereços no Novo DB ---\n";
foreach ($enderecos as $end) {
    echo "Rua: {$end->logradouro}, Num: {$end->numero}, Bairro: {$end->bairro}, CEP: {$end->cep}\n";
}

// Endereço no banco legado
$legacy = DB::connection('legacy')->table('clientes')->where('id', $cliente->id)->first();
if ($legacy) {
    echo "\n--- Endereço no Legado DB ---\n";
    echo "Rua/Endereco: " . ($legacy->pj_endereco ?? 'null') . "\n";
    echo "Bairro: " . ($legacy->pj_bairro ?? 'null') . "\n";
    echo "CEP: " . ($legacy->pj_cep ?? 'null') . "\n";
    echo "Numero: " . ($legacy->pj_numero ?? 'null') . "\n";
    echo "Complemento: " . ($legacy->pj_complemento ?? 'null') . "\n";
    echo "Cidade: " . ($legacy->pj_cidade ?? 'null') . "\n";
    echo "Estado: " . ($legacy->pj_estado ?? 'null') . "\n";
} else {
    echo "Cliente não encontrado no DB legado com ID {$cliente->id}.\n";
}
