<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cidade;

$q = '';
$ids = collect([]);

$query = Cidade::query()
    ->select(['id', 'nome', 'uf'])
    ->distinct()
    ->orderBy('nome');

echo "--- Testando Hidratação de IDs ---\n";
// Simula IDs
$testIds = [1, 2, 3]; // Substitua por IDs reais se souber
$hydrationQuery = clone $query;
$hydrationQuery->whereIn('id', $testIds);
echo "SQL Hidratação: " . $hydrationQuery->toSql() . "\n";
// echo "Resultados: " . $hydrationQuery->get()->count() . "\n";

echo "\n--- Testando Filtro de Cidades Ativas ---\n";
$activeQuery = clone $query;
$activeQuery->where('uf', 'RS')
      ->where(function ($sub) {
          $sub->whereHas('enderecos.cliente', function ($c) {
              $c->where('exibir_no_site', true);
          })
          ->orWhereHas('clientesQueAtendem', function ($c) {
              $c->where('exibir_no_site', true);
          });
      });

echo "SQL Filtro Ativas: " . $activeQuery->toSql() . "\n";
$results = $activeQuery->get();
echo "Total cidades ativas encontradas: " . $results->count() . "\n";
foreach($results->take(5) as $c) {
    echo "- {$c->nome} ({$c->id})\n";
}

echo "\n--- Testando Busca com LIKE ---\n";
$searchQuery = clone $activeQuery;
$searchTerm = 'Far';
$searchQuery->where(function ($sub) use ($searchTerm) {
    $sub->where('nome', 'like', "%{$searchTerm}%")
        ->orWhere('uf', 'like', "%{$searchTerm}%");
});
echo "SQL Busca: " . $searchQuery->toSql() . "\n";
$searchResults = $searchQuery->get();
echo "Resultados para '{$searchTerm}': " . $searchResults->count() . "\n";
