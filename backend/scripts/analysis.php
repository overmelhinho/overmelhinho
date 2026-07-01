<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$legacyDb = DB::connection('legacy');
$newDb = DB::connection('pgsql');

$startDate = '2026-05-01';
$endDate = '2026-05-31';

// Legacy data
// The legacy table is 'publicidades'. We sum the 'valor' column where 'data_emissao' is in May 2026.
$legacyQuery = $legacyDb->select("
    SELECT num_autorizacao, valor, data_emissao
    FROM publicidades
    WHERE data_emissao >= ? AND data_emissao <= ?
", [$startDate, $endDate]);

$legacyTotal = 0;
$legacyData = [];
foreach ($legacyQuery as $row) {
    $legacyTotal += $row->valor;
    $legacyData[$row->num_autorizacao] = $row->valor;
}

// New data
// The new table is 'autorizacoes'. We sum 'valor_total' where 'data_inicio' is in May 2026.
$newQuery = $newDb->select("
    SELECT numero, valor_total, data_inicio
    FROM autorizacoes
    WHERE data_inicio >= ? AND data_inicio <= ?
", [$startDate, $endDate]);

$newTotal = 0;
$newData = [];
foreach ($newQuery as $row) {
    $newTotal += $row->valor_total;
    $newData[$row->numero] = $row->valor_total;
}

// Find discrepancies
$discrepancies = [];
$allAuths = array_unique(array_merge(array_keys($legacyData), array_keys($newData)));

foreach ($allAuths as $auth) {
    $lVal = $legacyData[$auth] ?? 0;
    $nVal = $newData[$auth] ?? 0;

    if (abs($lVal - $nVal) > 0.01) {
        $discrepancies[$auth] = [
            'legacy' => $lVal,
            'new' => $nVal,
            'diff' => $nVal - $lVal
        ];
    }
}

$results = [
    'period' => "{$startDate} to {$endDate}",
    'legacy_total' => $legacyTotal,
    'new_total' => $newTotal,
    'diff' => $newTotal - $legacyTotal,
    'legacy_count' => count($legacyQuery),
    'new_count' => count($newQuery),
    'discrepancies' => $discrepancies
];

echo json_encode($results, JSON_PRETTY_PRINT);
