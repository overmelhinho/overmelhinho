<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;
use Illuminate\Support\Facades\DB;

$cliente = Cliente::where('nome_fantasia', 'ilike', '%Eco Santa Maria%')->first();
if (!$cliente) {
    echo "Cliente nao encontrado.\n";
    exit;
}

echo "Cliente: " . $cliente->nome_fantasia . "\n";
echo "Status Atual: " . $cliente->status_assinatura . "\n";
echo "Tipo Atual: " . $cliente->tipo_cliente . "\n";

$autorizacoes = DB::table('autorizacoes')->where('cliente_id', $cliente->id)->get();
echo "Total de Autorizacoes: " . $autorizacoes->count() . "\n";
foreach ($autorizacoes as $aut) {
    echo "Auth #{$aut->id} | Status: {$aut->status} | Fim: {$aut->data_fim}\n";
}

$today = \Carbon\Carbon::today()->format('Y-m-d');
$temVigente = DB::table('autorizacoes')
    ->where('cliente_id', $cliente->id)
    ->where('status', 'assinado')
    ->where('data_fim', '>=', $today)
    ->exists();
    
echo "Tem Vigente: " . ($temVigente ? 'SIM' : 'NAO') . "\n";
