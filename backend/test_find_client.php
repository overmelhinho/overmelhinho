<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cidade = 'Farroupilha';
$clientesNaCidade = \App\Models\Cliente::whereHas('enderecos', function($q) use ($cidade) {
        $q->where('cidade', 'ILIKE', '%' . $cidade . '%');
    })
    ->pluck('nome_fantasia')
    ->filter()
    ->mapWithKeys(function($n) {
        $clean = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(\Illuminate\Support\Str::ascii($n)));
        $words = array_filter(explode(' ', $clean), function($w) {
            return strlen($w) > 2;
        });
        return [$n => array_values($words)];
    })->toArray();

foreach ($clientesNaCidade as $originalName => $dbWords) {
    if (implode(',', $dbWords) === 'farroupilha') {
        echo "FOUND CLIENT: $originalName\n";
    }
}
