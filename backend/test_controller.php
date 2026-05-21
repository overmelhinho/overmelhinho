<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\Api\V1\ClienteController;
use App\Models\Cliente;

try {
    $cliente = Cliente::find(74982);
    if (!$cliente) {
        die("Cliente 74982 not found.\n");
    }

    echo "Status inicial: " . json_encode($cliente->exibir_no_site) . "\n";

    // Mock an update request that disables the toggle
    $request = Request::create('/api/v1/clientes/74982', 'PUT', [
        'nome_fantasia' => 'Doris Daitz Adv.',
        'cpf_cnpj' => '000.000.000-00',
        'exibir_no_site' => false,
        'exibir_data_fundacao' => false,
        'segmentos' => [] // empty segments for test
    ]);
    // The controller uses $request->user(), so we need to mock it if it's used.
    // Actually, update doesn't strictly need auth user unless there is a gate. Let's see.

    $controller = app(ClienteController::class);
    $response = $controller->update($request, 74982);

    echo "Response status: " . $response->getStatusCode() . "\n";
    
    $cliente->refresh();
    echo "Status final no banco: " . json_encode($cliente->exibir_no_site) . "\n";

} catch (\Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
