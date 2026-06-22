<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Autorizacao;

$aut = Autorizacao::find(41310);
if ($aut) {
    echo "Autorizacao 41310 Client ID: {$aut->cliente_id}\n";
    $c = $aut->cliente;
    if ($c) {
        echo "Client ID: {$c->id}, Name: {$c->nome_fantasia}\n";
    }
}
