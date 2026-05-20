<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/api/v1/clientes/16518', 'PUT', [
    'nome_fantasia' => 'Teste',
    'status_assinatura' => null
]);

$response = $kernel->handle($request);
$data = json_decode($response->getContent(), true);

if (isset($data['message'])) {
    echo "Message: " . $data['message'] . "\n";
}
if (isset($data['error'])) {
    echo "Error: " . $data['error'] . "\n";
}
if (isset($data['exception'])) {
    echo "Exception: " . $data['exception'] . "\n";
}
if (isset($data['file'])) {
    echo "File: " . $data['file'] . ":" . $data['line'] . "\n";
}
