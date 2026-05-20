<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$c = Cliente::where('nome_fantasia', 'ilike', '%AR Desentupidora%')->first();
if ($c) {
    echo "AR Desentupidora Logo URL: " . ($c->logo_url ?? 'NULL') . "\n";
} else {
    echo "Nao achou AR Desentupidora\n";
}
