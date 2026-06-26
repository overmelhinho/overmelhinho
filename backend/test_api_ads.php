<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

DB::enableQueryLog();

$requestAds = Request::create('/api/v1/public/ads', 'GET', [
    'keywords' => 'agescon'
]);
$controllerAds = $app->make(\App\Http\Controllers\Api\V1\PublicAdController::class);
$start = microtime(true);
$responseAds = $controllerAds->index($requestAds);
$elapsedAds = microtime(true) - $start;

echo "Ads elapsed time: {$elapsedAds}s\n";

$requestCities = Request::create('/api/v1/cidades', 'GET');
$controllerCities = $app->make(\App\Http\Controllers\Api\V1\CidadeController::class);
$start = microtime(true);
$responseCities = $controllerCities->index($requestCities);
$elapsedCities = microtime(true) - $start;

echo "Cities elapsed time: {$elapsedCities}s\n";

$queries = DB::getQueryLog();
echo "Total queries executed: " . count($queries) . "\n";

