<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\Api\V1\CidadeController;

$controller = new CidadeController();

// Test normal fetch (all 28 cities)
$req1 = new Request();
$res1 = $controller->index($req1);
$data1 = json_decode($res1->getContent(), true)['data'];
echo "All cities count: " . count($data1) . "\n";
foreach (array_slice($data1, 0, 5) as $c) {
    echo " - ID: {$c['id']} | Nome: '{$c['nome']}' | UF: {$c['uf']}\n";
}

// Test with search query
$req2 = new Request(['q' => 'roma']);
$res2 = $controller->index($req2);
$data2 = json_decode($res2->getContent(), true)['data'];
echo "\nSearch for 'roma' count: " . count($data2) . "\n";
foreach ($data2 as $c) {
    echo " - ID: {$c['id']} | Nome: '{$c['nome']}' | UF: {$c['uf']}\n";
}

// Test with IDs (duplicates included: 61, 62, 284, 318)
$req3 = new Request(['ids' => '61,62,284,318']);
$res3 = $controller->index($req3);
$data3 = json_decode($res3->getContent(), true)['data'];
echo "\nIDs 61,62,284,318 count: " . count($data3) . "\n";
foreach ($data3 as $c) {
    echo " - ID: {$c['id']} | Nome: '{$c['nome']}' | UF: {$c['uf']}\n";
}
