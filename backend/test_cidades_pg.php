<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

print_r(\Illuminate\Support\Facades\DB::connection('pgsql')->table('cliente_cidade')->where('cliente_id', 106572)->pluck('cidade_id')->toArray());
