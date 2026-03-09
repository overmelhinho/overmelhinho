<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Tentando habilitar pg_trgm...\n";
    DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    echo "Sucesso!\n";
} catch (\Exception $e) {
    echo "Falha ao habilitar pg_trgm: " . $e->getMessage() . "\n";
}

try {
    echo "Tentando habilitar fuzzystrmatch...\n";
    DB::statement('CREATE EXTENSION IF NOT EXISTS fuzzystrmatch');
    echo "Sucesso!\n";
} catch (\Exception $e) {
    echo "Falha ao habilitar fuzzystrmatch: " . $e->getMessage() . "\n";
}
