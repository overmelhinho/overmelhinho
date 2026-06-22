<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Endereco;
use Illuminate\Support\Facades\Schema;

$columns = Schema::getColumnListing('enderecos');
echo "Searching 'vazio' in table 'enderecos'...\n";

$query = Endereco::query();
$query->where(function($q) use ($columns) {
    foreach ($columns as $col) {
        $q->orWhere($col, 'ilike', '%vazio%');
    }
});

$results = $query->with('cliente:id,nome_fantasia')->get();

$outputPath = 'C:/Users/Windows/.gemini/antigravity/brain/eb67c4db-0e3a-485f-96ea-80823550f6a6/enderecos_vazio.md';

$md = "# Endereços com 'vazio'\n\n";
$md .= "Foram encontrados " . $results->count() . " endereços com a palavra 'vazio' no banco de dados.\n\n";
$md .= "| ID Endereço | ID Cliente | Nome Fantasia | Colunas com 'vazio' |\n";
$md .= "| :--- | :--- | :--- | :--- |\n";

foreach ($results as $res) {
    $matchedCols = [];
    foreach ($columns as $col) {
        if (str_contains(strtolower((string)$res->$col), 'vazio')) {
            $matchedCols[] = "**$col**: `{$res->$col}`";
        }
    }
    $matchedColsStr = implode("<br>", $matchedCols);
    $nomeFantasia = $res->cliente?->nome_fantasia ?: '*Não associado*';
    $md .= "| {$res->id} | {$res->cliente_id} | {$nomeFantasia} | {$matchedColsStr} |\n";
}

file_put_contents($outputPath, $md);
echo "Written " . $results->count() . " records to $outputPath\n";
