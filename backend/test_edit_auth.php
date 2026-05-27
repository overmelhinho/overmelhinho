<?php

require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Autorizacao;
use App\Models\Invoice;

// 1. Encontrar uma autorizacao assinada
$auth = Autorizacao::where('status', 'assinado')->first();
if (!$auth) {
    echo "Nenhuma autorização assinada encontrada para teste.\n";
    exit;
}

echo "Usando Autorizacao ID {$auth->id} (Numero {$auth->numero})\n";
$oldInvoices = Invoice::where('group_id', "autorizacao-{$auth->id}")->get();
echo "Faturas locais antes: " . $oldInvoices->count() . "\n";

// 2. Fazer request falso para o controller
$request = Illuminate\Http\Request::create("/api/v1/autorizacoes/{$auth->id}", 'PUT', [
    'valor_total' => $auth->valor_total + 100, // mudando o valor para disparar a lógica
    'tipo_publicidade' => 'WEB',
    'parcelas' => [
        ['vencimento' => '2026-06-01']
    ]
]);

$controller = new \App\Http\Controllers\Api\V1\AutorizacaoController();
$response = $controller->update($request, $auth->id);

echo "Resposta Status: " . $response->getStatusCode() . "\n";
$data = json_decode($response->getContent(), true);

echo "Antiga Autorizacao Status: " . $auth->fresh()->status . "\n";
echo "Nova Autorizacao ID: " . $data['data']['id'] . "\n";
echo "Nova Autorizacao Status: " . $data['data']['status'] . "\n";

$oldInvoicesAfter = Invoice::where('group_id', "autorizacao-{$auth->id}")->get();
echo "Faturas locais da antiga (status): " . $oldInvoicesAfter->pluck('status')->implode(',') . "\n";
