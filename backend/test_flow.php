<?php

use Illuminate\Http\Request;
use App\Http\Controllers\Api\V1\ClienteController;
use App\Models\Cliente;
use App\Models\Campanha;
use App\Models\Autorizacao;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    echo "0. Limpando base de testes...\n";
    Schema::disableForeignKeyConstraints();
    DB::table('autorizacoes')->truncate();
    DB::table('campanhas')->truncate();
    DB::table('clientes')->truncate();
    Schema::enableForeignKeyConstraints();

    echo "1. Testando Cadastro de Cliente...\n";
    $user = \App\Models\User::first();
    if ($user) {
        \Illuminate\Support\Facades\Auth::login($user);
    }
    $request = new Request();
    $request->merge([
        'nome_fantasia' => 'Google Brasil Teste',
        'cpf_cnpj' => '06990590000123',
        'tipo_cliente' => 'pagante',
        'status_assinatura' => 'ativa',
        'exibir_no_site' => true,
        'enderecos' => [
            [
                'cep' => '04538-133',
                'estado' => 'SP',
                'cidade' => 'São Paulo',
                'bairro' => 'Itaim Bibi',
                'rua' => 'Av. Brigadeiro Faria Lima',
                'numero' => '3477'
            ]
        ]
    ]);
    $controller = app(ClienteController::class);
    $response = $controller->store($request);
    $responseContent = json_decode($response->getContent(), true);
    if (!isset($responseContent['data']['id'])) {
        echo "❌ Falha ao criar cliente. Resposta da API:\n";
        print_r($responseContent);
        return;
    }
    $clientId = $responseContent['data']['id'];
    echo "✅ Cliente criado com sucesso. ID: {$clientId}\n";

    echo "2. Testando Cadastro de Campanha...\n";
    $campanhaId = \Illuminate\Support\Facades\DB::table('campanhas')->insertGetId([
        'cliente_id' => $clientId,
        'nome' => 'Campanha Google Teste',
        'tipo' => 'anuncio',
        'status' => 'ativa',
        'data_inicio' => now(),
        'data_fim' => now()->addMonths(6),
        'is_institucional' => false,
        'url' => 'https://google.com',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "✅ Campanha criada com sucesso. ID: {$campanhaId}\n";

    echo "3. Testando Autorização de Venda...\n";
    $autorizacao = Autorizacao::create([
        'numero' => rand(1000, 9999),
        'cliente_id' => $clientId,
        'tipo_publicidade' => 'WEB',
        'titulo_anuncio' => 'Anúncio Google Teste',
        'valor_total' => 1000.00,
        'taxa_cadastro' => 0,
        'data_inicio' => now(),
        'data_fim' => now()->addMonths(6),
        'modo_pagamento' => 'parcelado',
        'num_parcelas' => 1,
        'data_primeira_parcela' => now(),
        'status' => 'assinado',
        'assinado_em' => now()
    ]);
    echo "✅ Autorização gerada com sucesso. Número: {$autorizacao->numero}\n";

    echo "4. Testando Busca no Site Público...\n";
    $publicRequest = new Request();
    $publicRequest->merge(['q' => 'Google Brasil Teste']);
    $publicResponse = $controller->indexPublic($publicRequest);
    $results = $publicResponse->response()->getData(true)['data'];
    if (count($results) > 0) {
        echo "✅ Cliente encontrado na busca pública! Total resultados: " . count($results) . "\n";
    } else {
        echo "❌ Cliente não encontrado na busca pública.\n";
    }

} catch (\Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
