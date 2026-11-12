<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\Api\V1\CidadeController;
use App\Http\Controllers\Api\V1\SegmentoController;
use App\Http\Controllers\Api\V1\ClienteController;
use Illuminate\Http\Request;

function slugify($text) {
    return \Illuminate\Support\Str::slug($text);
}

$cidadeCtrl = new CidadeController();
$segCtrl = new SegmentoController();
$cliCtrl = new ClienteController();

// 1. Simula fetchCity('barao')
$cidades = $cidadeCtrl->index(new Request())->getData(true)['data'];
$city = null;
foreach ($cidades as $c) {
    if (slugify($c['nome']) === 'barao') {
        $city = $c;
        break;
    }
}

// 2. Simula fetchSegment('produtos-caseiros')
$segmentos = $segCtrl->index(new Request())->getData(true)['data'];
$segment = null;
foreach ($segmentos as $s) {
    if (slugify($s['slug'] ?? $s['nome']) === 'produtos-caseiros' || slugify($s['nome']) === 'produtos-caseiros') {
        $segment = $s;
        break;
    }
}

echo "Next.js Cidade resolvida: ID={$city['id']}, Nome={$city['nome']}\n";
echo "Next.js Segmento resolvido: ID={$segment['id']}, Nome={$segment['nome']}\n";

// 3. Simula fetchClients
$req = Request::create('/api/v1/public/search', 'GET', [
    'city_id' => $city['id'],
    'segment_id' => $segment['id'],
    'per_page' => 500
]);
$res = $cliCtrl->indexPublic($req)->getData(true);
$clients = $res['data'] ?? [];

echo "Resultado real da API para /barao/produtos-caseiros:\n";
echo "Total de empresas: " . count($clients) . "\n";
foreach ($clients as $c) {
    echo " -> #{$c['id']} {$c['nome_fantasia']} ({$c['tipo_cliente']})\n";
}

$httpStatus = (count($clients) > 0) ? 200 : 404;
echo "HTTP Status que o Next.js retorna: {$httpStatus} " . ($httpStatus === 200 ? 'OK' : 'Not Found') . "\n";
