<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tinyService = app(App\Services\TinyErpService::class);
$token = config('services.tiny.token');
$baseUrl = 'https://api.tiny.com.br/api2';

// 1. Let's find an invoice with tiny_id
$invoice = App\Models\Invoice::whereNotNull('tiny_account_id')->latest()->first();
if (!$invoice) die("No invoice\n");

$tinyId = $invoice->tiny_account_id;
echo "Testing with Tiny ID: $tinyId\n";

// Test 1: Try conta.receber.alterar with situacao = 'C' or '3' or 'Cancelada'
$conta = [
    'id' => (int)$tinyId,
    'situacao' => 'cancelado',
];

$response = Illuminate\Support\Facades\Http::asForm()->post("{$baseUrl}/conta.receber.alterar.php", [
    'token' => $token,
    'formato' => 'json',
    'conta' => json_encode(['conta' => $conta]),
]);
echo "Test 1 (Alterar status): \n";
print_r($response->json());

// Test 2: Try conta.receber.cancelar.php
$response2 = Illuminate\Support\Facades\Http::asForm()->post("{$baseUrl}/conta.receber.cancelar.php", [
    'token' => $token,
    'formato' => 'json',
    'id' => (int)$tinyId,
]);
echo "Test 2 (Cancelar endpoint): \n";
print_r($response2->json());

// Test 3: Try conta.receber.excluir.php
$response3 = Illuminate\Support\Facades\Http::asForm()->post("{$baseUrl}/conta.receber.excluir.php", [
    'token' => $token,
    'formato' => 'json',
    'id' => (int)$tinyId,
]);
echo "Test 3 (Excluir endpoint): \n";
print_r($response3->json());

