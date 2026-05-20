<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $clienteId = 16518;
    $end = \App\Models\Endereco::create([
        'cliente_id' => $clienteId,
        'estado' => 'RS',
        'cidade' => 'Farroupilha',
        'exibir_apenas_cidade' => false,
    ]);
    echo "SUCCESS with false\n";
} catch (\Exception $e) {
    echo "ERROR with false: " . $e->getMessage() . "\n";
}

try {
    $clienteId = 16518;
    $end = \App\Models\Endereco::create([
        'cliente_id' => $clienteId,
        'estado' => 'RS',
        'cidade' => 'Farroupilha',
        'exibir_apenas_cidade' => 'false',
    ]);
    echo "SUCCESS with 'false'\n";
} catch (\Exception $e) {
    echo "ERROR with 'false': " . $e->getMessage() . "\n";
}
