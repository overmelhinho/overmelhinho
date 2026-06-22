<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;

$request = Request::create('/api/v1/public/search', 'GET', [
    'q' => 'o vemrelihnho'
]);

$controller = $app->make(\App\Http\Controllers\Api\V1\ClienteController::class);
$collection = $controller->indexPublic($request);
$response = $collection->toResponse($request);
$data = json_decode($response->content(), true);

echo "Keys: " . implode(', ', array_keys($data)) . "\n";
if (isset($data['meta'])) {
    echo "Meta: " . json_encode($data['meta']) . "\n";
}
if (isset($data['data'])) {
    echo "Count data: " . count($data['data']) . "\n";
    foreach ($data['data'] as $item) {
        echo "  - Client ID: " . $item['id'] . ", Name: " . $item['nome_fantasia'] . "\n";
    }
}
