<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$gs = app(App\Services\GooglePlacesService::class);
$places = $gs->searchPlaces('pasteis na Serra Gaúcha - RS');
$count = 0;
foreach ($places as $place) {
    echo $place['name'] . ' - ' . $place['formatted_address'] . "\n";
    $count++;
}
echo "Total: $count\n";
