<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$typos = [
    ['casa', 'caza'],
    ['pizzaria', 'pizaria'],
    ['mecanico', 'meccanico'],
    ['restaurante', 'restauranti'],
    ['farmacia', 'farmaçia'],
];

echo "Testing Similarity (pg_trgm):\n";
echo str_pad("Term 1", 15) . " | " . str_pad("Term 2", 15) . " | " . "Similarity\n";
echo str_repeat("-", 45) . "\n";

foreach ($typos as [$t1, $t2]) {
    try {
        $res = DB::select('SELECT similarity(?, ?) as sim', [$t1, $t2]);
        $sim = $res[0]->sim;
        echo str_pad($t1, 15) . " | " . str_pad($t2, 15) . " | " . $sim . "\n";
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        break;
    }
}
