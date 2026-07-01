<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Endereco;

$end = Endereco::where('cliente_id', 105572)->first();
if (!$end) {
    echo "Endereco nao encontrado no banco novo para o cliente 105572.\n";
    exit;
}
echo "No banco novo: tipo_logradouro = " . ($end->tipo_logradouro ?: 'VAZIO') . "\n";

$lc = DB::connection('legacy')->table('clientes')->where('id', 105572)->first();
if (!$lc) {
    echo "Cliente nao encontrado no legado.\n";
    exit;
}

if (!$lc->id_endereco) {
    echo "id_endereco VAZIO no legado.\n";
    exit;
}

$leb = DB::connection('legacy')->table('enderecos_bairros')->where('id', $lc->id_endereco)->first();
if (!$leb) {
    echo "enderecos_bairros nao encontrado no legado.\n";
    exit;
}

$le = DB::connection('legacy')->table('enderecos')->where('id', $leb->id_endereco)->first();
if (!$le) {
    echo "enderecos nao encontrado no legado.\n";
    exit;
}

if (!$le->id_logradouro) {
    echo "id_logradouro VAZIO no legado.\n";
    exit;
}

$logr = DB::connection('legacy')->table('logradouros')->where('id', $le->id_logradouro)->first();
echo "No banco legado, o tipo de logradouro era: " . ($logr ? $logr->logradouro : 'NAO ENCONTRADO') . "\n";
