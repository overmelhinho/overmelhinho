<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$token = config('services.tiny.token');
$baseUrl = 'https://api.tiny.com.br/api2';
$testId = 350850763; // ID criado no teste anterior

echo "=== Testando alteração de HISTÓRICO ===\n";
$newHistory = "[INVÁLIDA - SUBSTITUÍDA] Teste de Histórico";

$r = Http::asForm()->post("{$baseUrl}/conta.receber.alterar.php", [
    'token' => $token, 'formato' => 'json', 'id' => $testId,
    'conta' => json_encode(['conta' => ['historico' => $newHistory]])
]);
echo "Res: " . $r->body() . "\n";

sleep(1);

$check = Http::asForm()->post("{$baseUrl}/conta.receber.obter.php", [
    'token' => $token, 'formato' => 'json', 'id' => $testId,
]);
$hist = $check->json()['retorno']['conta']['historico'] ?? '???';
echo "HISTÓRICO NO TINY: {$hist}\n";
