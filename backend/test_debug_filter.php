<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$googleApiKey = config('services.google.places_key');
$cidade = 'Farroupilha';
$segmento = 'Joalherias';

$query = "{$segmento} em {$cidade} - RS";
$response = Illuminate\Support\Facades\Http::get("https://maps.googleapis.com/maps/api/place/textsearch/json", [
    'query' => $query,
    'key' => $googleApiKey,
    'language' => 'pt-BR',
    'region' => 'br'
]);

$rawResults = $response->json('results') ?? [];

$clientesNaCidade = \App\Models\Cliente::whereHas('enderecos', function($q) use ($cidade) {
        $q->where('cidade', 'ILIKE', '%' . $cidade . '%');
    })
    ->pluck('nome_fantasia')
    ->filter()
    ->map(function($n) {
        $clean = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(\Illuminate\Support\Str::ascii($n)));
        $words = array_filter(explode(' ', $clean), function($w) {
            return strlen($w) > 2;
        });
        return array_values($words);
    })->toArray();

$stopwords = ['loja', 'comercial', 'comercio', 'industria', 'mercado', 'supermercado', 'padaria', 'farmacia', 'restaurante', 'lanchonete', 'pizzaria', 'bar', 'cafe', 'joalheria', 'otica', 'clinica', 'consultorio', 'escritorio', 'advocacia', 'centro', 'estetica', 'salao', 'auto', 'posto', 'mecanica', 'oficina', 'servicos', 'distribuidora', 'transportes', 'imobiliaria', 'construtora', 'arquitetura', 'engenharia', 'contabilidade', 'escola', 'academia', 'pet', 'shop', 'veterinaria', 'hospital', 'hotel', 'pousada', 'motel', 'clube', 'sindicato', 'igreja', 'templo', 'centro', 'veiculos', 'pecas', 'motopeças', 'autopeças', 'informatica', 'celulares', 'assistencia', 'tecnica', 'rs', 'brasil', 'ltda', 'me', 'epp', 'sa', 'cia', 'e', 'do', 'da', 'de', 'dos', 'das', 'com', 'para', 'por', 'na', 'no', 'nas', 'nos'];
$cidadeWords = explode(' ', mb_strtolower(\Illuminate\Support\Str::ascii($cidade)));
$stopwords = array_merge($stopwords, $cidadeWords);

foreach ($rawResults as $r) {
    $name = $r['name'];
    $cleanGName = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(\Illuminate\Support\Str::ascii($name)));
    $gWordsAll = array_values(array_filter(explode(' ', $cleanGName), fn($w) => strlen($w) > 2));
    $gWords = array_values(array_filter($gWordsAll, fn($w) => !in_array($w, $stopwords)));
    
    echo "TARGET: $name\n";
    echo "gWordsAll: " . implode(',', $gWordsAll) . "\n";
    echo "gWords: " . implode(',', $gWords) . "\n";
    
    $existsByName = false;
    foreach ($clientesNaCidade as $dbWords) {
        $dbWordsFiltered = array_values(array_filter($dbWords, fn($w) => !in_array($w, $stopwords)));
        
        $gCompare = $gWords;
        $dbCompare = $dbWordsFiltered;

        if (empty($gCompare) || empty($dbCompare)) {
            $gCompare = $gWordsAll;
            $dbCompare = $dbWords;
        }
        
        if (empty($dbCompare) || empty($gCompare)) continue;
        
        $intersect = array_intersect($gCompare, $dbCompare);
        if (count($intersect) >= min(2, count($dbCompare))) {
            echo "  -> MATCHED WITH DB: " . implode(',', $dbWords) . " (intersect: " . implode(',', $intersect) . ")\n";
            $existsByName = true;
            break;
        }
    }
}
