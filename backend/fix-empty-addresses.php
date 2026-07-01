<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Endereco;
use App\Models\Cliente;

$enderecosVazios = Endereco::where(function($query) {
    $query->whereNull('rua')->orWhere('rua', '');
})->get();

echo "Encontrados " . $enderecosVazios->count() . " enderecos vazios.\n\n";

$alterados = [];

// Cachear as tabelas do legado para não fazer query em loop
$bairrosMap = DB::connection('legacy')->table('bairros')->pluck('bairro', 'id')->toArray();
$cidadesMap = DB::connection('legacy')->table('cidades')->get()->keyBy('id');
$enderecosBairrosMap = DB::connection('legacy')->table('enderecos_bairros')->get()->keyBy('id');
$enderecosMap = DB::connection('legacy')->table('enderecos')->get()->keyBy('id');

foreach ($enderecosVazios as $end) {
    // Buscar o cliente no legado
    $lc = DB::connection('legacy')->table('clientes')->where('id', $end->cliente_id)->first();
    
    if (!$lc || !$lc->id_endereco) {
        continue;
    }

    $leb = $enderecosBairrosMap[$lc->id_endereco] ?? null;
    if ($leb) {
        $le = $enderecosMap[$leb->id_endereco] ?? null;
        if ($le && !empty(trim($le->endereco))) {
            $idBairro = $leb->id_bairro;
            $nomeBairro = $bairrosMap[$idBairro] ?? null;

            $cidadeObj = $cidadesMap[$le->id_cidade] ?? null;
            $nomeCidade = $cidadeObj ? $cidadeObj->cidade : null;
            $ufCidade = $cidadeObj ? $cidadeObj->uf : null;

            // Log the old vs new
            $alterados[] = [
                'cliente_id' => $end->cliente_id,
                'nome_fantasia' => $end->cliente->nome_fantasia ?? 'Desconhecido',
                'nova_rua' => $le->endereco,
                'novo_bairro' => $nomeBairro,
                'nova_cidade' => $nomeCidade,
            ];

            // Atualiza
            $end->rua = $le->endereco;
            if ($nomeBairro) $end->bairro = $nomeBairro;
            if ($nomeCidade) $end->cidade = $nomeCidade;
            if ($ufCidade) $end->estado = $ufCidade;
            if ($le->cep) $end->cep = $le->cep;
            if ($lc->numero) $end->numero = $lc->numero;
            if ($lc->complemento) $end->complemento = $lc->complemento;
            
            $end->save();
        }
    }
}

echo "Total de enderecos alterados: " . count($alterados) . "\n\n";
echo "--- LISTA DE CLIENTES ALTERADOS ---\n";
foreach ($alterados as $alt) {
    echo "ID {$alt['cliente_id']} - {$alt['nome_fantasia']}\n";
    echo "  -> Novo Endereco: {$alt['nova_rua']}, {$alt['novo_bairro']}, {$alt['nova_cidade']}\n";
}
