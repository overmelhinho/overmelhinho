<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$countLegacy = DB::connection('legacy')->select("SELECT COUNT(1) as total FROM empregos")[0]->total;
echo "Total in legacy 'empregos': $countLegacy\n";

$countNew = DB::connection('pgsql')->select("SELECT COUNT(1) as total FROM job_opportunities")[0]->total;
echo "Total in new 'job_opportunities': $countNew\n";
