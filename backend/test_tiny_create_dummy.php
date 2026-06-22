<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$token = config('services.tiny.token');
$baseUrl = 'https://api.tiny.com.br/api2';

$client = \App\Models\Cliente::whereNotNull('tiny_id')->first();
if (!$client) {
    die("No client with tiny_id found.\n");
}

$methods = ['pix', 'PIX'];
foreach ($methods as $m) {
    $contaReceber = [
        'data_emissao' => date('d/m/Y'),
        'vencimento' => date('d/m/Y', strtotime('+1 day')),
        'valor' => '10.00',
        'historico' => "TEST DUMMY PAYMENT METHOD $m",
        'cliente' => [
            'id' => (int)$client->tiny_id,
            'nome' => $client->nome_fantasia,
        ],
        'forma_pagamento' => $m,
        'observacoes' => 'Test',
    ];

    $response = Illuminate\Support\Facades\Http::asForm()->post("{$baseUrl}/conta.receber.incluir.php", [
        'token' => $token,
        'formato' => 'json',
        'conta' => json_encode(['conta' => array_merge(['sequencia' => '1'], $contaReceber)]),
    ]);

    $json = $response->json();
    $tinyId = $json['retorno']['registros'][0]['registro']['id'] ?? null;
    
    if ($tinyId) {
        $statusResponse = Illuminate\Support\Facades\Http::asForm()->post("{$baseUrl}/conta.receber.obter.php", [
            'token' => $token,
            'formato' => 'json',
            'id' => (int)$tinyId,
        ]);
        $returnedForm = $statusResponse->json()['retorno']['conta']['forma_pagamento'] ?? 'UNKNOWN';
        echo "Sent: $m | Tiny Returned: $returnedForm\n";
    } else {
        echo "Sent: $m | Tiny Error: " . json_encode($json) . "\n";
    }
}
