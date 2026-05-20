<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$q = DB::connection('legacy')->select("SELECT * FROM empregos LIMIT 1");
print_r($q);

$areas = DB::connection('legacy')->select("SELECT * FROM empregos_area_profissional LIMIT 3");
print_r($areas);

$cargos = DB::connection('legacy')->select("SELECT * FROM empregos_cargos LIMIT 3");
print_r($cargos);

$cidades = DB::connection('legacy')->select("SELECT * FROM cidades LIMIT 3");
print_r($cidades);
