<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cliente;
use Illuminate\Support\Facades\DB;

$rows = DB::table('cliente_cidade')
    ->where('cliente_id', 106572)
    ->get();

echo "Rows in cliente_cidade for São Bento (106572):\n";
foreach ($rows as $row) {
    $city = DB::table('cidades')->where('id', $row->cidade_id)->first();
    echo "  - Cidade ID: {$row->cidade_id} | Nome: " . ($city ? $city->nome : 'Desconhecida') . "\n";
}
