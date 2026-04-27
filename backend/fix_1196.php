<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$auth = App\Models\Autorizacao::where('numero', 1196)->first();
if ($auth) {
    $controller = app(App\Http\Controllers\Api\V1\AutorizacaoController::class);
    $reflector = new ReflectionClass($controller);
    $method = $reflector->getMethod('gerarParcelas');
    $method->setAccessible(true);
    $method->invoke($controller, $auth, []);
    echo "Parcelas geradas!\n";
}
