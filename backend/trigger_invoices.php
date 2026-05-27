<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$aut = App\Models\Autorizacao::with(['cliente', 'parcelas'])->where('numero', 'like', '%25912%')->first();
if (!$aut) {
    echo "Autorizacao nao encontrada\n";
    exit;
}

$tinyService = app(App\Services\TinyErpService::class);
$controller = new App\Http\Controllers\Api\V1\AutorizacaoController();

try {
    $result = $controller->generateInvoices($aut->id, $tinyService);
    echo "Sucesso: " . json_encode($result->getData()) . "\n";
} catch (\Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
