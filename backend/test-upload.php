<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

$supabaseUrl = rtrim(config('services.supabase.url'), '/');
$supabaseKey = config('services.supabase.key'); // O que o UploadTempController usa
$bucket = config('services.supabase.bucket', 'clientes-media');

$filename = Str::uuid() . '.txt';
$path = "temp/guest/{$filename}";
$url = "{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}";
$bytes = "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232c0001108000100010301220002110103111ffc4001500010100000000000000000000000000000006ffc40014100100000000000000000000000000000000ffc40014010100000000000000000000000000000000ffc40014110100000000000000000000000000000000ffda000c03010002110311003f009dfffd";
$bytes = hex2bin($bytes);
$mime = "image/jpeg";

$response = Http::withHeaders([
    'apikey'        => $supabaseKey,
    'Authorization' => "Bearer {$supabaseKey}",
    'Content-Type'  => $mime,
    'x-upsert'      => 'true',
])->withBody($bytes, $mime)->post($url);

echo "UPLOAD TEST:\n";
echo "Status: " . $response->status() . "\n";
echo "Body: " . $response->body() . "\n\n";

if ($response->successful()) {
    // Agora tenta copiar
    $serviceRoleKey = config('services.supabase.service_role_key') ?: $supabaseKey;
    $copyUrl = "{$supabaseUrl}/storage/v1/object/copy";
    $copyPayload = [
        'bucketId' => $bucket,
        'sourceKey' => $path,
        'destinationKey' => "temp/guest/copy-{$filename}",
        'destinationBucketId' => $bucket,
    ];

    $copyResp = Http::withHeaders([
        'apikey' => $serviceRoleKey,
        'Authorization' => "Bearer {$serviceRoleKey}",
        'Content-Type' => 'application/json',
    ])->post($copyUrl, $copyPayload);

    echo "COPY TEST:\n";
    echo "Status: " . $copyResp->status() . "\n";
    echo "Body: " . $copyResp->body() . "\n";
}
