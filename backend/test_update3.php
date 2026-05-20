<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $cliente = \App\Models\Cliente::find(16518);
    $cliente->enderecos()->delete();
    $cliente->enderecos()->create([
        'nome_unidade' => null,
        'telefone' => null,
        'cep' => '95.180-000',
        'estado' => 'RS',
        'cidade' => 'Farroupilha',
        'bairro' => 'Centro',
        'rua' => 'Coronel Pena de Moraes',
        'numero' => '297',
        'complemento' => null,
        'exibir_apenas_cidade' => 'false',
        'is_cobranca' => 'false',
        'endereco_compacto' => null
    ]);
    echo "SUCCESS\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
