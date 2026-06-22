<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$googleApiKey = config('services.google.places_key');
$query = "Machado Barbosa Adv. Associados em Farroupilha";

$response = Http::get(
    "https://maps.googleapis.com/maps/api/place/textsearch/json",
    ['query' => $query, 'key' => $googleApiKey]
);

echo "Google Search Results:\n";
$results = $response['results'] ?? [];
foreach ($results as $idx => $r) {
    echo "\nCandidate {$idx}:\n";
    echo " Name: {$r['name']}\n";
    echo " Place ID: {$r['place_id']}\n";
    echo " Address: {$r['formatted_address']}\n";
    
    // Get Details
    $detail = Http::get(
        "https://maps.googleapis.com/maps/api/place/details/json",
        [
            'place_id' => $r['place_id'],
            'key' => $googleApiKey,
            'fields' => 'name,formatted_address,formatted_phone_number,website'
        ]
    );
    
    if (isset($detail['result'])) {
        $res = $detail['result'];
        echo " Phone: " . ($res['formatted_phone_number'] ?? 'N/A') . "\n";
        echo " Website: " . ($res['website'] ?? 'N/A') . "\n";
    }
}
