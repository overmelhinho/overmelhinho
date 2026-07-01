<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$legacy = (array) DB::connection('legacy')->table('clientes')->where('id', 69440)->first();
$endereco_fields = [];
foreach ($legacy as $key => $value) {
    if (strpos($key, 'end') !== false || strpos($key, 'bairro') !== false || strpos($key, 'rua') !== false || strpos($key, 'cep') !== false || strpos($key, 'logra') !== false) {
        $endereco_fields[$key] = $value;
    }
}
print_r($endereco_fields);
