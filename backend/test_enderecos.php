<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \App\Models\Cliente::with('enderecos')->where('nome_fantasia', 'ilike', '%São Bento%')->get();
foreach ($c as $cli) {
    echo "ID: " . $cli->id . " - " . $cli->nome_fantasia . "\n";
    foreach ($cli->enderecos as $end) {
        echo "  Endereço: " . $end->rua . ", " . $end->numero . " - " . $end->bairro . " - " . $end->cidade . "\n";
    }
}
