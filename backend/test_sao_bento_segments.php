<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = App\Models\Cliente::where('id', 106572)->with('segmentos')->first();
if ($c) {
    dump($c->segmentos->pluck('nome')->toArray());
} else {
    echo "Not found\n";
}
