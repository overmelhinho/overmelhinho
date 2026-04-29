<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cidade;

echo "--- Testando Filtro de Cidades Ativas (Usando clientes()) ---\n";
$query = Cidade::query()
    ->select(['id', 'nome', 'uf'])
    ->distinct()
    ->orderBy('nome');

$activeQuery = clone $query;
$activeQuery->where('uf', 'RS')
      ->whereHas('clientes', function ($c) {
          $c->where('exibir_no_site', true);
      });

echo "SQL: " . $activeQuery->toSql() . "\n";
try {
    $results = $activeQuery->get();
    echo "Total cidades encontradas: " . $results->count() . "\n";
    foreach($results->take(10) as $c) {
        echo "- {$c->nome} ({$c->id})\n";
    }
} catch (\Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
}
