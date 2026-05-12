<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$clients = \App\Models\Cliente::where('nome_fantasia', 'ilike', '%laura%')
    ->get(['id', 'nome_fantasia', 'tipo_cliente', 'status_assinatura', 'exibir_no_site'])
    ->toArray();
    
file_put_contents(__DIR__.'/debug_laura.txt', json_encode($clients, JSON_PRETTY_PRINT));
echo "Done.";
