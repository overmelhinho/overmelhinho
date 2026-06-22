<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cidade;
use Illuminate\Support\Facades\DB;

$query = Cidade::query()
    ->select([
        DB::raw('MAX(id) as id'),
        DB::raw('TRIM(nome) as nome'),
        'uf'
    ])
    ->groupBy(DB::raw('TRIM(nome)'), 'uf')
    ->orderBy(DB::raw('TRIM(nome)'));

$cidadesPermitidas = [
    'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
    'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
    'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
    'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
    'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
    'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
];

$query->where('uf', 'RS')
      ->whereIn(DB::raw('trim(nome)'), $cidadesPermitidas);

$results = $query->get();

echo "Returned cities matching Caxias:\n";
foreach ($results as $city) {
    if (strpos(strtolower($city->nome), 'caxias') !== false) {
        echo "  - ID: {$city->id} | Nome: {$city->nome} | UF: {$city->uf}\n";
    }
}
