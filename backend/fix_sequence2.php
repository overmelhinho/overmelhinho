<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Autorizacao;

$log = [];

// 1. Temporarily change the messed up ones to a high number so they don't interfere
$messUps = Autorizacao::whereIn('numero', ['33429', '33430', '33431'])->get();
foreach ($messUps as $index => $m) {
    $m->numero = "TEMP-" . $index;
    $m->save();
}

// 2. NOW find the true max numero
$max = Autorizacao::whereNull('parent_id')
    ->whereRaw("numero ~ '^[0-9]+$'")
    ->selectRaw('MAX(CAST(numero AS INTEGER)) as max_num')
    ->value('max_num');

$nextSequence = (int) $max + 1;
$log[] = "True MAX numero found: $max. Starting renumbering at $nextSequence.";

// 3. Fix the messed up ones
$messUps = Autorizacao::where('numero', 'like', 'TEMP-%')->orderBy('id')->get();

foreach ($messUps as $auth) {
    $oldNum = $auth->numero;
    $newNum = str_pad((string)$nextSequence, 5, '0', STR_PAD_LEFT);
    $auth->numero = $newNum;
    $auth->save();
    $log[] = "Renumbered $oldNum to $newNum (ID: {$auth->id})";
    $nextSequence++;
}

echo implode("\n", $log) . "\n";
