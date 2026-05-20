<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$countEmpregos = DB::connection('legacy')->select("SELECT COUNT(1) as total FROM empregos")[0]->total;
echo "Total in legacy 'empregos': $countEmpregos\n";

$countCurriculos = DB::connection('legacy')->select("SELECT COUNT(1) as total FROM empregos_curriculos")[0]->total;
echo "Total in legacy 'empregos_curriculos': $countCurriculos\n";

$countVagaCurriculo = DB::connection('legacy')->select("SELECT COUNT(1) as total FROM vaga_curriculo")[0]->total;
echo "Total in legacy 'vaga_curriculo': $countVagaCurriculo\n";
