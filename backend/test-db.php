<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    $columns = Schema::getColumnListing('autorizacoes');
    echo "Colunas na tabela autorizacoes:\n";
    print_r($columns);
    
    echo "\n\nTestando se a autorização 41393 existe:\n";
    $aut = DB::table('autorizacoes')->where('id', 41393)->first();
    if ($aut) {
        echo "Existe! Status atual: {$aut->status}\n";
    } else {
        echo "Não encontrada.\n";
    }
} catch (\Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
