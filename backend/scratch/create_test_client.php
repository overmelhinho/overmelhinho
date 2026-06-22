<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$c = new Cliente();
$c->nome_fantasia = "Cliente E2E Teste Robot Temp";
$c->razao_social = "Cliente E2E Teste Robot Temp";
$c->tipo_cliente = "gratuito";
$c->save();

echo "Created client with ID: {$c->id}\n";

$c->delete();
echo "Deleted client!\n";
