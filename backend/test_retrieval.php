<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\Illuminate\Support\Facades\DB::update("update clientes set exibir_no_site = 'false' where id = 95845");
$c = App\Models\Cliente::find(95845);
var_dump($c->exibir_no_site);
