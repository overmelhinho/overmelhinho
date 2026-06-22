<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$token = config('services.tiny.token');
$baseUrl = 'https://api.tiny.com.br/api2';

$response = Illuminate\Support\Facades\Http::asForm()->post("{$baseUrl}/conta.receber.obter.php", [
    'token' => $token,
    'formato' => 'json',
    'id' => 358856952
]);

echo "Receivable Details from Tiny for 358856952:\n";
print_r($response->json());
