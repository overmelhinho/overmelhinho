<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$c = Cliente::with(['segmentos', 'enderecos'])->where('slug', 'o-vermelhinho-site-de-publicidade')->first();
if (!$c) {
    echo "Client not found!\n";
    exit;
}
echo "Nome Fantasia: " . $c->nome_fantasia . "\n";
echo "Nome Alternativo: " . $c->nome_alternativo . "\n";
echo "SEO Keywords: " . json_encode($c->seo_keywords) . "\n";
echo "Segmentos:\n";
foreach ($c->segmentos as $s) {
    echo "  - {$s->nome}\n";
}
echo "Endereços:\n";
foreach ($c->enderecos as $e) {
    echo "  - Rua: {$e->rua}, Bairro: {$e->bairro}, Cidade: {$e->cidade}\n";
}
