<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \App\Models\Cliente::find(105572);
if ($c) {
    echo "Sao Bento (105572) Logo URL: " . ($c->logo_url ?? 'NULL') . "\n";
    echo "logotipo_url: " . ($c->logotipo_url ?? 'NULL') . "\n";
    print_r($c->toArray());
} else {
    echo "Nao achou Sao Bento\n";
}
