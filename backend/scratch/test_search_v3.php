<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cidade;

$cidadesPermitidas = [
    'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
    'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
    'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
    'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
    'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
    'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
];

$query = Cidade::query()
    ->select(['id', 'nome', 'uf'])
    ->distinct()
    ->orderBy('nome')
    ->where('uf', 'RS')
    ->whereIn('nome', $cidadesPermitidas);

echo "--- Testando Lista Completa (Total esperado: 28) ---\n";
$all = (clone $query)->get();
echo "Total encontrado: " . $all->count() . "\n";

echo "\n--- Testando Busca 'cax' (Lowercase) ---\n";
$searchTerm = 'cax';
$search = (clone $query)->where(function ($sub) use ($searchTerm) {
    $sub->where('nome', 'ilike', "%{$searchTerm}%")
        ->orWhere('uf', 'ilike', "%{$searchTerm}%");
})->get();

echo "Resultados para '{$searchTerm}': " . $search->count() . "\n";
foreach($search as $c) {
    echo "- {$c->nome}\n";
}
