<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cols = \Illuminate\Support\Facades\DB::connection('legacy')->select('DESCRIBE clientes');
$cidades = [];
foreach($cols as $c) {
    if (strpos(strtolower($c->Field), 'cidad') !== false) {
        $cidades[] = $c->Field;
    }
}
print_r($cidades);
