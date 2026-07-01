<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$results = DB::connection('legacy')->select("SELECT num_autorizacao, COUNT(id) as count FROM publicidades WHERE num_autorizacao IS NOT NULL AND num_autorizacao != '' GROUP BY num_autorizacao HAVING COUNT(id) > 1 ORDER BY count DESC");
echo json_encode(['total_duplicates' => count($results), 'samples' => array_slice($results, 0, 5)]);
