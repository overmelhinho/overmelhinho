<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$req = new Illuminate\Http\Request(['termo' => 'pasteis', 'cidade' => 'geral']);
$c = app(App\Http\Controllers\Api\V1\RadarController::class);
$gs = app(App\Services\GooglePlacesService::class);
$response = $c->fetchTargets($req, $gs);
echo json_encode($response->getData(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
