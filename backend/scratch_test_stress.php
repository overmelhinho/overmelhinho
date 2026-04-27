<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;

$token = config('services.tiny.token');
$baseUrl = 'https://api.tiny.com.br/api2';

// 1. Criar conta para teste
$r = Http::asForm()->post("{$baseUrl}/conta.receber.incluir.php", [
    'token' => $token, 'formato' => 'json',
    'conta' => json_encode(['conta' => [
        'data_emissao' => date('d/m/Y'),
        'vencimento' => '01/12/2026',
        'valor' => '100.00',
        'historico' => 'TESTE FINAL ALTERAR',
        'cliente' => ['nome' => 'Teste', 'cpf_cnpj' => '49584901087'],
    ]]),
]);
$testId = $r->json()['retorno']['registros'][0]['registro']['id'] ?? null;
echo "Conta criada: ID {$testId}\n\n";

if (!$testId) exit;

$newAmount = '55.55';

// TESTE 1: ID fora do JSON (como campo do form)
echo "Teste 1: ID como campo do form...\n";
$r1 = Http::asForm()->post("{$baseUrl}/conta.receber.alterar.php", [
    'token' => $token, 'formato' => 'json', 'id' => $testId,
    'conta' => json_encode(['conta' => ['valor' => $newAmount, 'vencimento' => '01/12/2026']])
]);
echo "  Res: " . $r1->body() . "\n";

// TESTE 2: ID dentro do JSON 'conta'
echo "Teste 2: ID dentro do objeto conta...\n";
$r2 = Http::asForm()->post("{$baseUrl}/conta.receber.alterar.php", [
    'token' => $token, 'formato' => 'json',
    'conta' => json_encode(['conta' => ['id' => $testId, 'valor' => $newAmount, 'vencimento' => '01/12/2026']])
]);
echo "  Res: " . $r2->body() . "\n";

// TESTE 3: Sem o wrapper 'conta' no JSON
echo "Teste 3: JSON sem wrapper...\n";
$r3 = Http::asForm()->post("{$baseUrl}/conta.receber.alterar.php", [
    'token' => $token, 'formato' => 'json',
    'conta' => json_encode(['id' => $testId, 'valor' => $newAmount, 'vencimento' => '01/12/2026'])
]);
echo "  Res: " . $r3->body() . "\n";

// TESTE 4: Enviar TUDO via Query String e body vazio
echo "Teste 4: Tudo via Query String...\n";
$r4 = Http::post("{$baseUrl}/conta.receber.alterar.php?" . http_build_query([
    'token' => $token, 'formato' => 'json', 'id' => $testId,
    'conta' => json_encode(['conta' => ['valor' => $newAmount, 'vencimento' => '01/12/2026']])
]));
echo "  Res: " . $r4->body() . "\n";

// TESTE 5: Content-Type JSON real (Raw Body)
echo "Teste 5: Raw JSON Body...\n";
$r5 = Http::withHeaders(['Content-Type' => 'application/json'])->post("{$baseUrl}/conta.receber.alterar.php?token={$token}&formato=json", [
    'conta' => ['id' => $testId, 'valor' => $newAmount, 'vencimento' => '01/12/2026']
]);
echo "  Res: " . $r5->body() . "\n";

sleep(1);

// Verificação final
$check = Http::asForm()->post("{$baseUrl}/conta.receber.obter.php", [
    'token' => $token, 'formato' => 'json', 'id' => $testId,
]);
$val = $check->json()['retorno']['conta']['valor'] ?? '???';
echo "\nVALOR FINAL NO TINY: R$ {$val}\n";
if ($val == $newAmount) {
    echo "🎯 CONSEGUIMOS! O formato correto foi encontrado.\n";
} else {
    echo "❌ Nenhum formato funcionou.\n";
}
