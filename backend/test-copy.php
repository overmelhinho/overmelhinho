<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$supabaseUrl = rtrim(config('services.supabase.url'), '/');
// We want to force the use of the anon key, if possible.
// Unfortunately, locally SUPABASE_KEY IS the service role key!
// We can't really test it if both are service role keys.
$supabaseKey = config('services.supabase.key');
$bucket = config('services.supabase.bucket', 'clientes-media');

$sourceKey = 'temp/guest/6e973c4f-7dc1-4010-88f8-6e98c4bc53e5.jpg'; // one of the files from previous list
$destKey1 = 'temp/guest/test-copy1.jpg';
$destKey2 = 'temp/guest/test-copy2.jpg';

// Test 1: destinationBucketId
$payload1 = [
    'bucketId' => $bucket,
    'sourceKey' => $sourceKey,
    'destinationKey' => $destKey1,
    'destinationBucketId' => $bucket,
];

$resp1 = Http::withHeaders([
    'apikey' => $supabaseKey,
    'Authorization' => "Bearer {$supabaseKey}",
    'Content-Type' => 'application/json',
])->post("{$supabaseUrl}/storage/v1/object/copy", $payload1);

echo "Test 1 (destinationBucketId):\n";
echo $resp1->status() . "\n";
echo $resp1->body() . "\n\n";

// Test 2: destinationBucket
$payload2 = [
    'bucketId' => $bucket,
    'sourceKey' => $sourceKey,
    'destinationKey' => $destKey2,
    'destinationBucket' => $bucket,
];

$resp2 = Http::withHeaders([
    'apikey' => $supabaseKey,
    'Authorization' => "Bearer {$supabaseKey}",
    'Content-Type' => 'application/json',
])->post("{$supabaseUrl}/storage/v1/object/copy", $payload2);

echo "Test 2 (destinationBucket):\n";
echo $resp2->status() . "\n";
echo $resp2->body() . "\n\n";
