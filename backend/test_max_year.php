<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$results = \DB::select("
    SELECT extract(year from created_at) as ano, max(cast(numero as integer)) as max_numero, count(*) as total
    FROM autorizacoes
    WHERE numero ~ '^[0-9]+$'
    GROUP BY extract(year from created_at)
    ORDER BY ano DESC
");

print_r($results);
