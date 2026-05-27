<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$aut = App\Models\Autorizacao::find(41295);
echo json_encode([
    'numero' => $aut->numero,
    'parent_id' => $aut->parent_id,
    'is_bonificacao' => $aut->is_bonificacao,
    'valor_total' => $aut->valor_total
], JSON_PRETTY_PRINT);
