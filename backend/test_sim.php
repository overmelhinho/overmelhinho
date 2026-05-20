<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$res = \Illuminate\Support\Facades\DB::select("SELECT similarity('desentupidora', 'Deseju Pasteis') as sim");
echo "Deseju Pasteis: " . $res[0]->sim . "\n";

$res2 = \Illuminate\Support\Facades\DB::select("SELECT similarity('desentupidora', 'Designer Moveis') as sim");
echo "Designer Moveis: " . $res2[0]->sim . "\n";

$res3 = \Illuminate\Support\Facades\DB::select("SELECT similarity('desentupidora', 'Centro de Compras Farroupilha') as sim");
echo "Centro de Compras: " . $res3[0]->sim . "\n";
