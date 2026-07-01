<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Endereco;

$end = Endereco::where('cliente_id', 105572)->first();
echo json_encode($end->toArray(), JSON_PRETTY_PRINT);
