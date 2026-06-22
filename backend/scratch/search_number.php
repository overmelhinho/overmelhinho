<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Search in contatos
$contatos = DB::table('contatos')
    ->where('telefone_principal', 'like', '%3261%')
    ->orWhere('celular', 'like', '%3261%')
    ->get();

echo "Contatos count matching 3261: " . count($contatos) . "\n";
foreach ($contatos as $c) {
    echo "Contato ID: {$c->id} | Cliente ID: {$c->cliente_id} | Principal: {$c->telefone_principal} | Celular: {$c->celular}\n";
}

// Search in clientes
$clientes = DB::table('clientes')
    ->where('audit_differences', 'like', '%3261%')
    ->get();

echo "\nClientes count with 3261 in audit_differences: " . count($clientes) . "\n";
foreach ($clientes as $c) {
    echo "Cliente ID: {$c->id} | Nome: {$c->nome_fantasia} | Diff: {$c->audit_differences}\n";
}
