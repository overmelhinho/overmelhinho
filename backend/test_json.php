<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$c = Cliente::where('nome_fantasia', 'ilike', '%Eco Santa Maria%')->first();
if ($c) {
    echo json_encode($c->toArray(), JSON_PRETTY_PRINT);
} else {
    echo "Nao achou Eco Santa Maria\n";
}
