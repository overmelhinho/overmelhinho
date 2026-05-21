<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\Illuminate\Support\Facades\DB::update("update clientes set exibir_no_site = 'true' where id = 95845");
$c = App\Models\Cliente::find(95845);
$c->exibir_no_site = false;
var_dump("Is dirty? " . ($c->isDirty('exibir_no_site') ? "yes" : "no"));
$c->save();

$c->refresh();
var_dump("Saved correctly as: " . json_encode($c->exibir_no_site));

$c->exibir_no_site = true;
var_dump("Is dirty true? " . ($c->isDirty('exibir_no_site') ? "yes" : "no"));
$c->save();

$c->refresh();
var_dump("Saved correctly as: " . json_encode($c->exibir_no_site));
