<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$controller = new \App\Http\Controllers\Api\V1\ClienteController();
$response = $controller->auditStats();

echo "Response Status: " . $response->getStatusCode() . "\n";
echo "Response Body:\n";
print_r(json_decode($response->getContent(), true));
