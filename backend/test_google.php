<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$cidade = 'Farroupilha';
$segmento = 'Joalherias';

$clientesNaCidade = App\Models\Cliente::where('cidade', 'ILIKE', '%' . $cidade . '%')
    ->pluck('nome_fantasia')
    ->filter()
    ->map(function($n) {
        $clean = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $n)));
        return array_values(array_filter(explode(' ', $clean), fn($w) => strlen($w) > 2));
    })->toArray();

$googleService = app(App\Services\GooglePlacesService::class);
$query = $segmento . ' em ' . $cidade . ' - RS';
$places = $googleService->searchPlaces($query);

$stopwords = ['loja', 'comercial', 'comercio', 'industria', 'mercado', 'supermercado', 'padaria', 'farmacia', 'restaurante', 'lanchonete', 'pizzaria', 'bar', 'cafe', 'joalheria', 'otica', 'clinica', 'consultorio', 'escritorio', 'advocacia', 'centro', 'estetica', 'salao', 'auto', 'posto', 'mecanica', 'oficina', 'servicos', 'distribuidora', 'transportes', 'imobiliaria', 'construtora', 'arquitetura', 'engenharia', 'contabilidade', 'escola', 'academia', 'pet', 'shop', 'veterinaria', 'hospital', 'hotel', 'pousada', 'motel', 'clube', 'sindicato', 'igreja', 'templo', 'centro', 'veiculos', 'pecas', 'motopeças', 'autopeças', 'informatica', 'celulares', 'assistencia', 'tecnica'];

echo count($places) . " lugares encontrados no Google\n";
$targets = [];
foreach ($places as $place) {
    $name = $place['name'];
    $cleanGName = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $name)));
    $gWords = array_values(array_filter(explode(' ', $cleanGName), fn($w) => strlen($w) > 2 && !in_array($w, $stopwords)));
    
    $existsByName = false;
    foreach ($clientesNaCidade as $dbWords) {
        $dbWordsFiltered = array_values(array_filter($dbWords, fn($w) => !in_array($w, $stopwords)));
        if (empty($dbWordsFiltered) || empty($gWords)) continue;
        
        $intersect = array_intersect($gWords, $dbWordsFiltered);
        if (count($intersect) >= min(2, count($dbWordsFiltered))) {
            echo "Filtrado: $name. Bateu com BD: " . implode(' ', $dbWords) . "\n";
            $existsByName = true;
            break;
        }
    }
    if (!$existsByName) {
        $targets[] = $name;
    }
}
echo count($targets) . " alvos validados\n";
