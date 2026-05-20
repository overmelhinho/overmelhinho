<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$legacy = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')
    ->where('pj_nome_fantasia', 'like', '%São Bento%')
    ->where('pj_nome_fantasia', 'like', '%Desentupidora%')
    ->get();

foreach ($legacy as $l) {
    echo "ID: $l->id | Nome: $l->pj_nome_fantasia | Endereco: $l->id_endereco\n";
    $end = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->where('id', $l->id_endereco)->first();
    if ($end) {
        $cidade = \Illuminate\Support\Facades\DB::connection('legacy')->table('cidades')->where('id', $end->id_cidade)->first();
        echo "  Rua: $end->endereco | Num: $l->numero | Cidade: " . ($cidade ? $cidade->cidade : 'N/A') . "\n";
    }
}
