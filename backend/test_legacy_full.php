<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$legacy = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')
    ->where(function($q) {
        $q->where('pj_nome_fantasia', 'like', '%São Bento%')
          ->orWhere('pj_nome_fantasia', 'like', '%Sao Bento%')
          ->orWhere('pj_razao_social', 'like', '%São Bento%')
          ->orWhere('pj_razao_social', 'like', '%Sao Bento%');
    })
    ->where(function($q) {
        $q->where('pj_nome_fantasia', 'like', '%Desentupidora%')
          ->orWhere('pj_razao_social', 'like', '%Desentupidora%');
    })
    ->orderBy('id', 'asc')
    ->get();

foreach ($legacy as $l) {
    echo "ID: $l->id | Fantasia: $l->pj_nome_fantasia | Razao: $l->pj_razao_social | EndID: $l->id_endereco\n";
    $end = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->where('id', $l->id_endereco)->first();
    if ($end) {
        $cid = \Illuminate\Support\Facades\DB::connection('legacy')->table('cidades')->where('id', $end->id_cidade)->first();
        echo "  Rua: $end->endereco | Cidade: " . ($cid ? $cid->cidade : 'N/A') . "\n";
    }
}
