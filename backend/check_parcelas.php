<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parcelas = App\Models\AutorizacaoParcela::where('autorizacao_id', 41295)->get();
foreach ($parcelas as $p) {
    echo "Parcela {$p->numero} - Created: {$p->created_at} - Updated: {$p->updated_at}\n";
}
