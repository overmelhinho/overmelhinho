<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

DB::enableQueryLog();

$request = Request::create('/api/v1/public/search/suggestions', 'GET', [
    'q' => 'agescon'
]);

$controller = $app->make(\App\Http\Controllers\Api\V1\ClienteController::class);
$start = microtime(true);
$response = $controller->suggestions($request);
$elapsed = microtime(true) - $start;

echo "Suggestions elapsed time: {$elapsed}s\n";

$queries = DB::getQueryLog();
foreach ($queries as $idx => $q) {
    echo "Query " . ($idx + 1) . " (Time: " . $q['time'] . "ms):\n";
    echo $q['query'] . "\n";
    echo "Bindings: " . json_encode($q['bindings']) . "\n\n";
}
