<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cliente;
use Illuminate\Http\Request;

$cliente = Cliente::first();
echo "Testing update for Client ID: {$cliente->id}\n";

$controller = new \App\Http\Controllers\Api\V1\ClienteController();
$request = new Request();
$request->setMethod('PUT');
$request->replace([
    'nome_fantasia' => $cliente->nome_fantasia,
    'cpf_cnpj' => $cliente->cpf_cnpj,
    'audit_status' => 'manual_review',
    'last_audit_at' => now()->toIso8601String(),
    'audit_action' => 'audit_save'
]);

// Mock authenticated user if possible, or we can see if it proceeds without it
$user = \App\Models\User::first();
if ($user) {
    $request->setUserResolver(function() use ($user) {
        return $user;
    });
    echo "Mocked user: {$user->name}\n";
}

try {
    $response = $controller->update($request, $cliente->id);
    echo "Response status: " . $response->getStatusCode() . "\n";
    echo "Response content: " . substr($response->getContent(), 0, 500) . "\n";
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "Validation failed: " . json_encode($e->errors()) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
