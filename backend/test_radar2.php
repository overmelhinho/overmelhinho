<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$stopwords = ['otica'];
$cidade = 'Farroupilha';
$cidadeWords = explode(' ', mb_strtolower(\Illuminate\Support\Str::ascii($cidade)));
$stopwords = array_merge($stopwords, $cidadeWords);

$dbClients = [
    ['nova', 'otica', 'farroupilha'],
    ['otica', 'pro', 'vision', 'farroupilha'],
    ['otica', 'e', 'joalheria', 'farroupilha'],
    ['otica', 'farroupilha']
];

$name = 'Ótica Farroupilha';
$cleanGName = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(\Illuminate\Support\Str::ascii($name)));
$gWordsAll = array_values(array_filter(explode(' ', $cleanGName), fn($w) => strlen($w) > 2));
$gWords = array_values(array_filter($gWordsAll, fn($w) => !in_array($w, $stopwords)));

$existsByName = false;
foreach ($dbClients as $dbWords) {
    $dbWordsFiltered = array_values(array_filter($dbWords, fn($w) => !in_array($w, $stopwords)));
    
    $gCompare = $gWords;
    $dbCompare = $dbWordsFiltered;

    // Se um dos dois for composto APENAS de stopwords, comparamos usando todas as palavras originais
    if (empty($gCompare) || empty($dbCompare)) {
        $gCompare = $gWordsAll;
        $dbCompare = $dbWords;
    }
    
    if (empty($dbCompare) || empty($gCompare)) continue;
    
    $intersect = array_intersect($gCompare, $dbCompare);
    
    if (count($intersect) >= min(2, count($dbCompare))) {
        echo "Match with: " . implode(' ', $dbWords) . "\n";
        $existsByName = true;
        break;
    }
}
if (!$existsByName) {
    echo "NO MATCH!\n";
}
