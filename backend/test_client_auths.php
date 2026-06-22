<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Autorizacao;

$auths = Autorizacao::where('cliente_id', 106572)->orderBy('id', 'desc')->get();
echo "Total autorizacoes for client 106572: " . $auths->count() . "\n";
foreach ($auths as $a) {
    echo "ID: {$a->id}, Numero: {$a->numero}, Status: {$a->status}, Valor: {$a->valor_total}, Parent: {$a->parent_id}, Created: {$a->created_at->format('d/m/Y H:i')}\n";
}
