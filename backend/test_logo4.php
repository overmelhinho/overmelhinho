<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \App\Models\Cliente::where('nome_fantasia', 'ilike', '%Farroupilha%')->first();
print_r($c->toArray());
