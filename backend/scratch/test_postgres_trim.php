<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cidadesPermitidas = [
    'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
    'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
    'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
    'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
    'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
    'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
];

try {
    $cities = \App\Models\Cidade::select([
            \Illuminate\Support\Facades\DB::raw('MAX(id) as id'),
            \Illuminate\Support\Facades\DB::raw('TRIM(nome) as nome')
        ])
        ->where('uf', 'RS')
        ->whereIn(\Illuminate\Support\Facades\DB::raw('trim(nome)'), $cidadesPermitidas)
        ->groupBy(\Illuminate\Support\Facades\DB::raw('trim(nome)'))
        ->orderBy(\Illuminate\Support\Facades\DB::raw('trim(nome)'))
        ->get();

    echo "Query succeeded. Count: " . $cities->count() . "\n";
    foreach ($cities as $c) {
        echo " - ID: {$c->id} | Name: '{$c->nome}'\n";
    }
} catch (\Exception $e) {
    echo "Query failed: " . $e->getMessage() . "\n";
}
