<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ends = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')
    ->where('endereco', 'like', '%Carazinho%')
    ->get();

foreach ($ends as $end) {
    $clis = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')->where('id_endereco', $end->id)->get();
    foreach ($clis as $c) {
        if ($c->numero == '200') {
            echo "MATCH!! Cliente ID: $c->id | Nome: $c->pj_nome_fantasia | EndID: $end->id | Rua: $end->endereco, Num: $c->numero\n";
        }
    }
}
