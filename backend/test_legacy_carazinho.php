<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ends = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')
    ->where('endereco', 'like', '%Carazinho%')
    ->get();

foreach ($ends as $end) {
    echo "End ID: $end->id | Rua: $end->endereco\n";
    $cli = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')->where('id_endereco', $end->id)->get();
    foreach ($cli as $c) {
        echo "  Cliente: $c->id | Nome: $c->pj_nome_fantasia | Num: $c->numero\n";
    }
}
