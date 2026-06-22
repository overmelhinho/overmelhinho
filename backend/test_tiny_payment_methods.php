<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$token = config('services.tiny.token');
$baseUrl = 'https://api.tiny.com.br/api2';

$response = Illuminate\Support\Facades\Http::asForm()->post("{$baseUrl}/formas.recebimento.pesquisa.php", [
    'token' => $token,
    'formato' => 'json'
]);

echo "Response from formas.recebimento.pesquisa.php:\n";
print_r($response->json());
