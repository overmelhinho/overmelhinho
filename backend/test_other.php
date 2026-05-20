<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$clients = \App\Models\Cliente::has('cidadesAtendidas', '>', 3)->with(['enderecos', 'cidadesAtendidas'])->take(3)->get();

foreach ($clients as $c) {
    echo "NOVO SISTEMA:\n";
    echo "ID: $c->id | Nome: $c->nome_fantasia\n";
    foreach ($c->enderecos as $e) {
        echo "  Matriz Endereco: $e->rua, $e->numero - $e->cidade\n";
    }
    echo "  Cidades Atendidas (" . $c->cidadesAtendidas->count() . "): ";
    foreach ($c->cidadesAtendidas as $city) {
        echo $city->nome . ", ";
    }
    echo "\n\n";

    echo "LEGADO:\n";
    $legacy = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')
        ->where('pj_nome_fantasia', $c->nome_fantasia)
        ->orderBy('id', 'asc')
        ->get();
    
    foreach ($legacy as $l) {
        echo "  Legado ID: $l->id\n";
        $end = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->where('id', $l->id_endereco)->first();
        if ($end) {
            $cid = \Illuminate\Support\Facades\DB::connection('legacy')->table('cidades')->where('id', $end->id_cidade)->first();
            echo "    Rua: $end->endereco, $l->numero - " . ($cid ? $cid->cidade : 'N/A') . "\n";
        } else {
            echo "    Sem endereco\n";
        }
    }
    echo "---------------------------\n";
}
