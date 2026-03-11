<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$id = 48;
$cliente = \App\Models\Cliente::with('reviews')->find($id);

if (!$cliente) {
    echo "Cliente não encontrado\n";
    exit;
}

$data = [
    'horario_atendimento' => $cliente->horario_atendimento,
    'reviews_count' => $cliente->reviews()->count(),
    'reviews' => $cliente->reviews->toArray(),
];

file_put_contents('client_48_debug.json', json_encode($data, JSON_PRETTY_PRINT));
echo "Salvo em client_48_debug.json\n";
