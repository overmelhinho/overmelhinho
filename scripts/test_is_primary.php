<?php
require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$cols = Schema::getColumnListing('cliente_segmento');
echo "Columns of cliente_segmento: " . implode(', ', $cols) . "\n";

$sample = DB::table('cliente_segmento')->where('cliente_id', function($q) {
    $q->select('id')->from('clientes')->where('slug', 'like', '%escola-municipal-de-ensino-fundamental-1o-de-maio%')->limit(1);
})->get();

print_r($sample);

