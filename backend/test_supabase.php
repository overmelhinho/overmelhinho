<?php
// Teste de conectividade com Supabase Storage
$supabaseUrl = 'https://spefwgjsltjryxcizype.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwZWZ3Z2pzbHRqcnl4Y2l6eXBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIyMjMyMiwiZXhwIjoyMDY0Nzk4MzIyfQ.M7ShUU2KByMJVszm1QxT-JyCylaLqw7Z-TOsdz0k89o';
$bucket = 'clientes-media';

// 1. Lista os buckets existentes
echo "=== LISTANDO BUCKETS ===" . PHP_EOL;
$ch = curl_init("$supabaseUrl/storage/v1/bucket");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        "apikey: $supabaseKey",
        "Authorization: Bearer $supabaseKey",
    ],
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

echo "HTTP: $code" . PHP_EOL;
if ($err) echo "cURL ERROR: $err" . PHP_EOL;
echo $resp . PHP_EOL . PHP_EOL;

// 2. Faz upload de um arquivo de teste
echo "=== TESTANDO UPLOAD ===" . PHP_EOL;
$testContent = "hello test " . time();
$path = "temp/test/hello-" . time() . ".txt";
$url  = "$supabaseUrl/storage/v1/object/$bucket/$path";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => "POST",
    CURLOPT_POSTFIELDS     => $testContent,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => [
        "apikey: $supabaseKey",
        "Authorization: Bearer $supabaseKey",
        "Content-Type: text/plain",
    ],
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

echo "HTTP: $code" . PHP_EOL;
if ($err) echo "cURL ERROR: $err" . PHP_EOL;
echo $resp . PHP_EOL;
