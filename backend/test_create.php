<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $cliente = App\Models\Cliente::create([
        'nome_fantasia' => 'Teste',
        'cpf_cnpj' => '12345678901',
        'exibir_no_site' => 'true',
        'exibir_data_fundacao' => 'true',
        'possui_publicidade' => 'false',
        'tipo_cliente' => 'gratuito',
        'status_assinatura' => 'cancelada'
    ]);
    echo "Cliente criado: " . $cliente->id . "\n";
} catch (\Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
}
