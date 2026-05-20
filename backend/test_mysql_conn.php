<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $start = microtime(true);
    echo "Connecting to MySQL...\n";
    $count = DB::connection('mysql')->table('empresas')->count();
    $end = microtime(true);
    echo "Count: $count (Took " . round($end - $start, 2) . "s)\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
