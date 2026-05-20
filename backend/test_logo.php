<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$c = Cliente::where('nome_fantasia', 'ilike', '%Eco Santa Maria%')->first();
if ($c) {
    echo "Logo URL: " . ($c->logo_url ?? 'NULL') . "\n";
} else {
    echo "Nao achou Eco Santa Maria\n";
}

$c2 = Cliente::where('nome_fantasia', 'ilike', '%São Bento%')->first();
if ($c2) {
    echo "Logo URL Sao Bento: " . ($c2->logo_url ?? 'NULL') . "\n";
} else {
    echo "Nao achou Sao Bento\n";
}
