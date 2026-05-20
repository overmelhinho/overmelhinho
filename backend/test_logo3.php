<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$c = Cliente::where('nome_fantasia', 'ilike', '%Desentupidora Farroupilha%')->first();
if ($c) {
    echo "Farroupilha Logo URL: " . ($c->logo_url ?? 'NULL') . "\n";
    echo json_encode($c->toArray(), JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Nao achou Farroupilha\n";
}
