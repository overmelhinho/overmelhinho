<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$c = Cliente::find(38);
if ($c) {
    echo "Found client 38: " . json_encode($c, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Client 38 NOT found!\n";
}
