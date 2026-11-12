<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\V1\ClienteController;
use Illuminate\Http\Request;

$c7 = DB::table('cidades')->where('id', 7)->first();
echo "Cidade ID 7: " . ($c7->nome ?? 'não existe') . "\n";

$c63 = DB::table('cidades')->where('id', 63)->first();
echo "Cidade ID 63: " . ($c63->nome ?? 'não existe') . "\n";

$controller = new ClienteController();

// Teste com Barão real (ID 63) e Produtos Caseiros (ID 319)
$reqBarao = Request::create('/api/v1/public/search', 'GET', [
    'city_id' => 63,
    'segment_id' => 319,
    'per_page' => 500
]);
$resBarao = $controller->indexPublic($reqBarao)->getData(true);
$clientsBarao = $resBarao['data'] ?? [];
echo "Busca Barão (id=63) + Produtos Caseiros (id=319): " . count($clientsBarao) . " clientes encontrados:\n";
foreach ($clientsBarao as $c) {
    echo " - #{$c['id']}: {$c['nome_fantasia']} (tipo: {$c['tipo_cliente']}, status: {$c['status_assinatura']}, exibir: " . var_export($c['exibir_no_site'], true) . ")\n";
    if (!empty($c['enderecos'])) {
        echo "   Endereço: " . ($c['enderecos'][0]['rua'] ?? '') . ", " . ($c['enderecos'][0]['cidade'] ?? '') . "\n";
    }
}

