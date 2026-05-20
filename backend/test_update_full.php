<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cliente = App\Models\Cliente::with(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'cidadesAtendidas'])->find(16518);
$payload = $cliente->toArray();
$payload['segmentos'] = [
    ['id' => 229, 'nome' => 'Corretor de imoveis'],
    ['id' => 40, 'nome' => 'Imobiliárias']
];
$payload['cidades_atendidas'] = $cliente->cidadesAtendidas->pluck('id')->toArray();
$payload['enderecos'] = $cliente->enderecos->toArray();
$payload['contatos'] = $cliente->contatos->toArray();
$payload['redes_sociais'] = $cliente->redesSociais->toArray();

$payload['tipo_cliente'] = 'gratuito'; // Simulate what the user selected in the UI

$request = Illuminate\Http\Request::create('/api/v1/clientes/16518', 'PUT', $payload);

$controller = app(\App\Http\Controllers\Api\V1\ClienteController::class);
try {
    $response = $controller->update($request, 16518);
    $data = json_decode($response->getContent(), true);
    if (isset($data['error'])) {
        echo "ERROR: " . $data['error'] . "\n";
    } else {
        echo "SUCCESS\n";
    }
} catch (\Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n" . $e->getFile() . ":" . $e->getLine() . "\n";
}
