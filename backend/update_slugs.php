<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;
use Illuminate\Support\Str;

$clientes = Cliente::whereNull('slug')->orWhere('slug', '')->get();
echo "Atualizando slugs para " . $clientes->count() . " clientes...\n";

foreach ($clientes as $cliente) {
    if (!empty($cliente->nome_fantasia)) {
        // O evento 'saving' no model já vai cuidar da geração do slug
        // Só precisamos forçar um save.
        $cliente->save();
        echo "ID {$cliente->id}: {$cliente->nome_fantasia} -> {$cliente->slug}\n";
    }
}

echo "Concluído.\n";
