<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\Illuminate\Support\Facades\DB::enableQueryLog();
$c = App\Models\Cliente::first();
$c->update(['exibir_no_site' => true]);
$c->update(['exibir_no_site' => false]);
print_r(\Illuminate\Support\Facades\DB::getQueryLog());
