<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$supabaseUrl = rtrim(config('services.supabase.url'), '/');
$supabaseKey = config('services.supabase.service_role_key') ?: config('services.supabase.key');
$bucket = config('services.supabase.bucket', 'clientes-media');

$url = "{$supabaseUrl}/storage/v1/object/list/{$bucket}";
$response = Http::withHeaders([
    'apikey' => $supabaseKey,
    'Authorization' => "Bearer {$supabaseKey}",
    'Content-Type' => 'application/json',
])->post($url, [
    'prefix' => 'temp/guest/',
    'limit' => 10,
    'offset' => 0,
    'sortBy' => [
        'column' => 'created_at',
        'order' => 'desc',
    ]
]);

echo "LIST:\n";
print_r($response->json());
