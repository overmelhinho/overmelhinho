<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$tableName = 'cliente_reviews';
echo "--- Verificando Estrutura da Tabela: $tableName ---\n";

if (!Schema::hasTable($tableName)) {
    die("Tabela $tableName não existe no banco de dados.\n");
}

$columns = DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?", [$tableName]);

foreach ($columns as $col) {
    echo "Coluna: {$col->column_name} | Tipo: {$col->data_type}\n";
}

$sample = DB::table($tableName)->limit(5)->get();
echo "\nAmostra de dados (5 registros):\n";
echo json_encode($sample, JSON_PRETTY_PRINT) . "\n";

echo "--- Fim ---\n";
