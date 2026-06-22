<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$cidadesPermitidas = [
    'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
    'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
    'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
    'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
    'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
    'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
];

$allCidades = DB::table('cidades')->select('id', 'nome', 'uf')->get();
echo "Total cities in 'cidades' table: " . count($allCidades) . "\n";

$nonStandard = [];
$standardFound = [];
foreach ($allCidades as $c) {
    $nomeTrimmed = trim($c->nome);
    // Case insensitive match
    $matched = false;
    foreach ($cidadesPermitidas as $perm) {
        if (strcasecmp($nomeTrimmed, $perm) === 0) {
            $matched = true;
            break;
        }
    }
    if ($matched) {
        $standardFound[] = $nomeTrimmed;
    } else {
        $nonStandard[] = "{$nomeTrimmed} ({$c->uf}) [ID: {$c->id}]";
    }
}

echo "\nStandard Cities Found in Table: " . count(array_unique($standardFound)) . "/28\n";
echo "Missing standard cities: " . json_encode(array_diff($cidadesPermitidas, $standardFound)) . "\n";

echo "\nNon-Standard Cities in 'cidades' table (first 50): \n";
foreach (array_slice($nonStandard, 0, 50) as $ns) {
    echo " - " . $ns . "\n";
}
if (count($nonStandard) > 50) {
    echo " ... and " . (count($nonStandard) - 50) . " more.\n";
}
