<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pendentes = \App\Models\Autorizacao::with('cliente:id,nome_fantasia,razao_social')
            ->where('tiny_needs_manual_cancellation', 'true')
            ->where('status', 'cancelado')
            ->get(['id', 'numero', 'cliente_id', 'created_at', 'updated_at']);

echo json_encode($pendentes);
