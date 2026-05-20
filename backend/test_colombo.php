<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$legacy = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')
    ->where('id', 28118)
    ->first();

if ($legacy) {
    echo "ID: $legacy->id | EndID: $legacy->id_endereco\n";
    $end = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->where('id', $legacy->id_endereco)->first();
    if ($end) {
        echo "  Rua no DB legado: $end->endereco\n";
    }
}
