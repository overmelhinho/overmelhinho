<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$zapa = \Illuminate\Support\Facades\DB::select("SELECT similarity('Zapa Com. de Equipamentos de Segurança', 'zapa') as sim")[0]->sim;
$zatti = \Illuminate\Support\Facades\DB::select("SELECT similarity('ZattiVet', 'zapa') as sim")[0]->sim;
echo "Zapa sim: $zapa\n";
echo "Zatti sim: $zatti\n";
