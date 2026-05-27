<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$aut = App\Models\Autorizacao::find(41295);
echo json_encode([
    'assinatura_base64' => !empty($aut->assinatura_base64),
    'justificativa_assinatura' => $aut->justificativa_assinatura,
    'justificado_por' => $aut->justificado_por,
], JSON_PRETTY_PRINT);
