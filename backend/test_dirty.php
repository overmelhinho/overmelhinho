<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\Illuminate\Support\Facades\DB::update("update clientes set exibir_no_site = 'true' where id = 95845");
$c = App\Models\Cliente::find(95845);
$c->exibir_no_site = 'false';
var_dump($c->isDirty('exibir_no_site'));
$c->save();
$c->refresh();
var_dump($c->exibir_no_site);
