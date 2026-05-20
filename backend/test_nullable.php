<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$c = DB::connection('pgsql')->select("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'campanhas' AND column_name = 'cliente_id'");
echo "cliente_id is_nullable: " . $c[0]->is_nullable . "\n";
