<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = App\Models\Cliente::first();
$c->exibir_no_site = 'false';
echo json_encode($c->exibir_no_site);
