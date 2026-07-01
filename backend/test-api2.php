<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Endereco;

$enderecos = Endereco::where('cliente_id', 105572)->get();
echo "Total de endereços: " . $enderecos->count() . "\n";
foreach ($enderecos as $end) {
    echo "ID: $end->id | Rua: $end->rua | Tipo: " . ($end->tipo_logradouro ?: 'NULL') . "\n";
}
