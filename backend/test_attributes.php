<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c1 = new App\Models\Cliente();
$c1->exibir_no_site = true;
var_dump($c1->getAttributes()['exibir_no_site']);

$c2 = new App\Models\Cliente();
$c2->exibir_no_site = 'true';
var_dump($c2->getAttributes()['exibir_no_site']);

$c3 = new App\Models\Cliente();
$c3->exibir_no_site = 'false';
var_dump($c3->getAttributes()['exibir_no_site']);
