<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $cliente = \App\Models\Cliente::create([
        'nome_fantasia' => 'Teste Tinker Gratuito', 
        'tipo_cliente' => 'gratuito', 
        'status_assinatura' => 'ativa', 
        'exibir_no_site' => 'true', 
        'exibir_data_fundacao' => 'true', 
        'possui_publicidade' => 'false'
    ]);
    echo "SUCESSO! ID: " . $cliente->id . "\n";
} catch (\Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
}
