<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$leb = DB::connection('legacy')->table('enderecos_bairros')->where('id', 1274)->first();
if ($leb) {
    echo "Enderecos Bairros ID: {$leb->id}\n";
    echo "ID Endereco Real: {$leb->id_endereco}\n";
    echo "ID Bairro: {$leb->id_bairro}\n";
    
    $le = DB::connection('legacy')->table('enderecos')->where('id', $leb->id_endereco)->first();
    echo "Rua: {$le->endereco}\n";
    echo "CEP: {$le->cep}\n";

    $bairro = DB::connection('legacy')->table('bairros')->where('id', $leb->id_bairro)->first();
    echo "Bairro: {$bairro->bairro}\n";
} else {
    echo "Not found in enderecos_bairros.\n";
}
