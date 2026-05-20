<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$fields = ['faixa_salarial', 'tipo_contrato', 'metodo_trabalho', 'nivel_escolaridade'];
$result = [];
foreach ($fields as $field) {
    $result[$field] = DB::connection('legacy')->table('empregos')->distinct()->pluck($field)->toArray();
}
echo json_encode($result, JSON_PRETTY_PRINT);
