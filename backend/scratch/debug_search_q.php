<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$q = "Cliente E2E Teste Robot Editado";
$qDigits = preg_replace('/\D+/', '', $q) ?? $q;

$query = Cliente::query();
$query->where(function ($sub) use ($q, $qDigits) {
    $sub->where('nome_fantasia', 'ilike', "%{$q}%")
        ->orWhere('razao_social', 'ilike', "%{$q}%")
        ->when(strlen($qDigits) >= 4, function ($sq) use ($qDigits) {
            $sq->orWhere('cpf_cnpj', 'like', "%{$qDigits}%");
        });
});

$results = $query->get();
echo "Found " . $results->count() . " matches:\n";
foreach ($results as $r) {
    echo "ID: {$r->id}, Nome: {$r->nome_fantasia}\n";
}
