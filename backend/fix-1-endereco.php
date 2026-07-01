<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Cliente;
use App\Models\Endereco;

$cliente = Cliente::find(69440);
if (!$cliente) die("Cliente não encontrado\n");

$lc = DB::connection('legacy')->table('clientes')->where('id', 69440)->first();
if (!$lc || !$lc->id_endereco) die("id_endereco não encontrado no legado\n");

$leb = DB::connection('legacy')->table('enderecos_bairros')->where('id', $lc->id_endereco)->first();
$le = DB::connection('legacy')->table('enderecos')->where('id', $leb->id_endereco)->first();
$bairro = DB::connection('legacy')->table('bairros')->where('id', $leb->id_bairro)->first();
$cidade = DB::connection('legacy')->table('cidades')->where('id', $le->id_cidade)->first();

$rua = $le->endereco;
$cep = $le->cep;
$nomeBairro = $bairro->bairro;
$nomeCidade = $cidade->cidade;
$estado = $cidade->uf;

echo "Novo Endereco a ser salvo: \n";
echo "Rua: $rua \n Bairro: $nomeBairro \n CEP: $cep \n Cidade: $nomeCidade \n UF: $estado \n";

Endereco::updateOrCreate(
    ['cliente_id' => $cliente->id],
    [
        'rua' => $rua,
        'bairro' => $nomeBairro,
        'cep' => $cep,
        'cidade' => $nomeCidade,
        'estado' => $estado,
        'numero' => $lc->numero,
        'complemento' => $lc->complemento,
    ]
);

echo "Pronto!\n";
