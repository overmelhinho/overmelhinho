<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$legacy = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')
    ->where('pj_razao_social', 'like', '%São Bento Desentupidora Ltda%')
    ->get();

foreach ($legacy as $l) {
    echo "ID: $l->id | Nome: $l->pj_nome_fantasia\n";
    $end = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->where('id', $l->id_endereco)->first();
    if ($end) echo "  Rua: $end->endereco, Num: $l->numero\n";
}
