<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$legacy = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')
    ->where(function($q) {
        $q->where('pj_nome_fantasia', 'like', '%São Bento%')
          ->orWhere('pj_razao_social', 'like', '%São Bento%');
    })
    ->where(function($q) {
        $q->where('pj_nome_fantasia', 'like', '%Desentupidora%')
          ->orWhere('pj_razao_social', 'like', '%Desentupidora%');
    })
    ->orderBy('id', 'asc')
    ->get();

echo "RESULTADOS DO BANCO DE DADOS LEGADO LOCAL:\n";
echo "--------------------------------------------------\n";

foreach ($legacy as $l) {
    echo "ID Cliente: " . str_pad($l->id, 8);
    echo " | Fantasia: " . str_pad(substr($l->pj_nome_fantasia, 0, 25), 25);
    echo " | Razao: " . str_pad(substr($l->pj_razao_social, 0, 30), 30);
    
    $end = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->where('id', $l->id_endereco)->first();
    
    if ($end) {
        $cid = \Illuminate\Support\Facades\DB::connection('legacy')->table('cidades')->where('id', $end->id_cidade)->first();
        echo " | Endereco ID: " . str_pad($l->id_endereco, 5);
        echo " | Rua: " . str_pad(substr($end->endereco, 0, 25), 25);
        echo " | Num: " . str_pad($l->numero, 5);
        echo " | Cidade: " . ($cid ? $cid->cidade : 'N/A') . "\n";
    } else {
        echo " | Endereco ID: " . str_pad((string)$l->id_endereco, 5) . " (SEM RUA NO BANCO)\n";
    }
}
echo "--------------------------------------------------\n";
