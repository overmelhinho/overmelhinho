<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cidade;

$cidadesPermitidas = [
    'ALTO FELIZ', 'ARROIO DO SAL', 'BARÃO', 'BENTO GONÇALVES', 'BOA VISTA DO SUL',
    'BOM PRINCÍPIO', 'CAMPO BOM', 'CANELA', 'CARLOS BARBOSA', 'CAXIAS DO SUL',
    'CORONEL PILAR', 'FARROUPILHA', 'FELIZ', 'FLORES DA CUNHA', 'GARIBALDI',
    'GRAMADO', 'LAJEADO', 'MONTE BELO SUL', 'NOVA PRATA', 'NOVA ROMA DO SUL',
    'NOVO HAMBURGO', 'PINTO BANDEIRA', 'SALVADOR DO SUL', 'SÃO MARCOS',
    'SÃO PEDRO DA SERRA', 'SÃO SEBASTIÃO DO CAÍ', 'SÃO VENDELINO', 'VERANÓPOLIS'
];

$query = Cidade::query()
    ->select(['id', 'nome', 'uf'])
    ->where('uf', 'RS')
    ->whereIn(\Illuminate\Support\Facades\DB::raw('UPPER(nome)'), $cidadesPermitidas);

echo "--- Testando Lista Completa (Total esperado: 28) ---\n";
$all = (clone $query)->get();
echo "Total encontrado: " . $all->count() . "\n";
foreach($all as $c) {
    echo "- {$c->nome}\n";
}

echo "\n--- Testando Busca 'Cax' (Case Insensitive) ---\n";
$searchTerm = 'Cax';
$search = (clone $query)->where(function ($sub) use ($searchTerm) {
    $sub->where('nome', 'ilike', "%{$searchTerm}%")
        ->orWhere('uf', 'ilike', "%{$searchTerm}%");
})->get();

echo "Resultados para '{$searchTerm}': " . $search->count() . "\n";
foreach($search as $c) {
    echo "- {$c->nome}\n";
}

echo "\n--- Testando Busca 'cax' (Lowercase) ---\n";
$searchTerm = 'cax';
$searchLower = (clone $query)->where(function ($sub) use ($searchTerm) {
    $sub->where('nome', 'ilike', "%{$searchTerm}%")
        ->orWhere('uf', 'ilike', "%{$searchTerm}%");
})->get();

echo "Resultados para '{$searchTerm}': " . $searchLower->count() . "\n";
foreach($searchLower as $c) {
    echo "- {$c->nome}\n";
}
