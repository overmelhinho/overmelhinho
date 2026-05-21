<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
echo json_encode(Illuminate\Support\Facades\DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cliente_segmento'"));
