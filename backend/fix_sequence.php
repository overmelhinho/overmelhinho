<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Autorizacao;

$log = [];

// 1. Fix old legacy outliers (33422 to 33425)
$outliers = Autorizacao::whereIn('numero', ['33422', '33423', '33424', '33425'])->get();
foreach ($outliers as $outlier) {
    $oldNum = $outlier->numero;
    $newNum = "LEG-" . $oldNum;
    $outlier->numero = $newNum;
    $outlier->save();
    $log[] = "Updated legacy outlier $oldNum to $newNum (ID: {$outlier->id})";
}

// 2. Find the true max numero (should be 25905 now)
$max = Autorizacao::whereNull('parent_id')
    ->whereRaw("numero ~ '^[0-9]+$'")
    ->selectRaw('MAX(CAST(numero AS INTEGER)) as max_num')
    ->value('max_num');

$nextSequence = (int) $max + 1;
$log[] = "True MAX numero found: $max. Starting renumbering at $nextSequence.";

// 3. Fix newly generated ones that got caught in the jump (33426 and above)
$newAuths = Autorizacao::whereRaw("numero ~ '^[0-9]+$'")
    ->whereRaw('CAST(numero AS INTEGER) >= 33426')
    ->orderBy('created_at')
    ->get();

foreach ($newAuths as $auth) {
    $oldNum = $auth->numero;
    $newNum = str_pad((string)$nextSequence, 5, '0', STR_PAD_LEFT);
    $auth->numero = $newNum;
    $auth->save();
    $log[] = "Renumbered newly generated $oldNum to $newNum (ID: {$auth->id})";
    $nextSequence++;
}

echo implode("\n", $log) . "\n";
