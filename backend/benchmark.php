<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$t = microtime(true);
$results = App\Models\Cliente::where('nome_fantasia', 'ilike', '%Cliente E2E Teste Robot Editado%')->get();
$elapsed = microtime(true) - $t;

echo "Time: " . $elapsed . "s\n";
echo "Count: " . count($results) . "\n";
