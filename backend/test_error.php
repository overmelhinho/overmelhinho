<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = \Illuminate\Http\Request::create('/api/v1/clientes', 'POST', [
    'nome_fantasia' => 'Teste Falha 2',
    'cpf_cnpj' => '',
    'razao_social' => '',
    'enderecos' => [
        [
            'cep' => '',
            'estado' => '',
            'cidade' => '',
            'bairro' => '',
            'rua' => '',
            'numero' => '',
            'complemento' => '',
            'exibir_apenas_cidade' => false,
        ]
    ],
    'contatos' => [
        [
            'telefone_principal' => '',
            'telefone_secundario' => '',
            'celular' => '',
            'telefone_outro' => '',
            'email_principal' => '',
            'nome_contato' => '',
        ]
    ],
    'redes_sociais' => [],
    'tipo_cliente' => 'gratuito',
    'status_assinatura' => 'cancelada',
    'logotipo' => null,
    'video' => null,
    'portfolio_url' => null,
    'contact_preference' => '',
    'best_contact_shift' => '',
    'contract_ends_at' => null,
    'generate_seo_keywords' => true,
    'data_fundacao' => null,
    'google_place_id' => null,
    'horario_atendimento' => [],
    'reviews' => [],
    'beneficios' => [],
    'tipo_arquivo_midia' => 'catalogo',
    'exibir_data_fundacao' => true,
]);

try {
    $controller = new \App\Http\Controllers\Api\V1\ClienteController();
    $response = $controller->store($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Conteúdo: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "ERRO EXCEPTION: " . $e->getMessage() . "\n";
}
