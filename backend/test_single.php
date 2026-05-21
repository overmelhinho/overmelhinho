<?php
$cidades = ['Farroupilha', 'Caxias do Sul'];
foreach ($cidades as $cidade) {
    $clientesNaCidade = App\Models\Cliente::where('cidade', 'ILIKE', '%' . $cidade . '%')
        ->pluck('nome_fantasia')
        ->filter()
        ->map(function($n) {
            $clean = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $n)));
            return array_values(array_filter(explode(' ', $clean), fn($w) => strlen($w) > 2));
        })->toArray();
    
    $singleWords = array_filter($clientesNaCidade, fn($words) => count($words) == 1);
    echo "\n$cidade:\n";
    foreach(array_slice($singleWords, 0, 10) as $w) {
        echo implode(" ", $w) . "\n";
    }
}
