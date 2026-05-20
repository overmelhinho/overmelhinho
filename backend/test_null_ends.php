<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$endIds = [11924, 13917, 12494];
$ends = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->whereIn('id', $endIds)->get();
foreach ($ends as $end) {
    $cidade = \Illuminate\Support\Facades\DB::connection('legacy')->table('cidades')->where('id', $end->id_cidade)->first();
    echo "End ID: $end->id | Cidade: " . ($cidade ? $cidade->cidade : 'N/A') . "\n";
}
