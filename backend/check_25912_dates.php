<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$aut = App\Models\Autorizacao::find(41295);
echo json_encode([
    'numero' => $aut->numero,
    'created_at' => $aut->created_at->toDateTimeString(),
    'assinado_em' => $aut->assinado_em,
], JSON_PRETTY_PRINT);
