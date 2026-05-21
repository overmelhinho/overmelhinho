<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\Illuminate\Support\Facades\DB::enableQueryLog();
try {
    $c = App\Models\Cliente::first();
    $c->exibir_no_site = 'true';
    $c->save();
    $c->exibir_no_site = 'false';
    $c->save();
    print_r(\Illuminate\Support\Facades\DB::getQueryLog());
} catch (\Exception $e) {
    echo "Error saving string natively: " . $e->getMessage() . "\n";
}
