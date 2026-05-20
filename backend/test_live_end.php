<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$row = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')->where('id', 106572)->first();
echo "ID: " . $row->id . " | Endereco ID: " . $row->id_endereco . "\n";
$end = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->where('id', $row->id_endereco)->first();
print_r($end);
