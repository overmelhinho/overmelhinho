<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$row = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')->where('id', 106572)->first();
echo "Cliente id_endereco: " . $row->id_endereco . "\n";

$endRel = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos_bairros')->where('id', $row->id_endereco)->first();
echo "Enderecos Bairros id_endereco: " . $endRel->id_endereco . "\n";

$end = \Illuminate\Support\Facades\DB::connection('legacy')->table('enderecos')->where('id', $endRel->id_endereco)->first();
print_r($end);
