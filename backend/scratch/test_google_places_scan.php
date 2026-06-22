<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\LeadIntelService;

$service = app(LeadIntelService::class);
$result = $service->buscarDados("Machado Barbosa Adv. Associados", null, "Farroupilha");

echo "Result:\n";
print_r($result);
