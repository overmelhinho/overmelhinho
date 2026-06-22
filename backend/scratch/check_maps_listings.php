<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$googleApiKey = config('services.google.places_key');

// Search for the phone number itself on Google Places
$response1 = Http::get(
    "https://maps.googleapis.com/maps/api/place/textsearch/json",
    ['query' => "54 3261-1146 Farroupilha", 'key' => $googleApiKey]
);
echo "Search by Phone (54 3261-1146) results count: " . count($response1['results'] ?? []) . "\n";
foreach ($response1['results'] ?? [] as $r) {
    echo " - Name: {$r['name']} | Place ID: {$r['place_id']} | Address: {$r['formatted_address']}\n";
}

// Search for "Machado Barbosa" variants
$response2 = Http::get(
    "https://maps.googleapis.com/maps/api/place/textsearch/json",
    ['query' => "Machado Barbosa Farroupilha", 'key' => $googleApiKey]
);
echo "\nSearch by Name (Machado Barbosa Farroupilha) results count: " . count($response2['results'] ?? []) . "\n";
foreach ($response2['results'] ?? [] as $r) {
    echo " - Name: {$r['name']} | Place ID: {$r['place_id']} | Address: {$r['formatted_address']}\n";
}
