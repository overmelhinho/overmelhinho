<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$controller = new \App\Http\Controllers\Api\V1\ClienteController();
$response = $controller->auditCityStats();

echo "Response Status: " . $response->getStatusCode() . "\n";
$data = json_decode($response->getContent(), true);
echo "Count: " . count($data) . "\n";
echo "Cities in response:\n";
foreach ($data as $c) {
    echo " - " . $c['nome'] . " (Total: " . $c['total'] . ", Auditados: " . $c['auditados'] . ", Pendentes: " . $c['pendentes'] . ")\n";
}
