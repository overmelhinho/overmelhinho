<?php

require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cidade;
use App\Models\Segmento;

$c64 = Cidade::find(64);
echo "Cidade 64: " . ($c64 ? $c64->nome : 'NAO ENCONTRADA') . "\n";

$caxias = Cidade::where('nome', 'ilike', '%caxias%')->get();
foreach ($caxias as $c) {
    echo "Caxias: [{$c->id}] {$c->nome}\n";
}

$s899 = Segmento::find(899);
echo "Segmento 899: " . ($s899 ? $s899->nome : 'NAO ENCONTRADO') . "\n";

