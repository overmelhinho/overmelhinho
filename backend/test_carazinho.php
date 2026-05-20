<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ends = \App\Models\Endereco::where('rua', 'ilike', '%Carazinho%')->get();
foreach ($ends as $e) {
    echo "End: " . $e->rua . " " . $e->numero . "\n";
    $cli = \App\Models\Cliente::find($e->cliente_id);
    if ($cli) {
        echo "  Cliente: " . $cli->id . " - " . $cli->nome_fantasia . "\n";
    }
}
