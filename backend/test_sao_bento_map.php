<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$e = \App\Models\Endereco::where('cliente_id', 84914)->first();
$response = Illuminate\Support\Facades\Http::withHeaders(['User-Agent' => 'Overmelhinho/1.0'])->get('https://nominatim.openstreetmap.org/search', ['q' => '504 Senador Joaquim Pedro Salgado Filho, São Bento, Bento Gonçalves, RS, Brasil', 'format' => 'json']);
if ($response->successful() && !empty($response->json())) {
    $data = $response->json()[0];
    $e->update(['latitude' => (float) $data['lat'], 'longitude' => (float) $data['lon']]);
    echo "Geocoded to " . $data['lat'] . ", " . $data['lon'];
} else {
    echo "Failed geocoding";
}
