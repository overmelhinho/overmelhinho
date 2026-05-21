<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\Illuminate\Support\Facades\DB::enableQueryLog();

try {
    \Illuminate\Support\Facades\DB::update('update clientes set exibir_no_site = false where id = 95845');
    $c = App\Models\Cliente::find(95845);
    $c->exibir_no_site = true;
    $c->save();
    echo "Saved true natively!\n";
} catch (\Exception $e) {
    echo "Error saving true: " . $e->getMessage() . "\n";
}

try {
    \Illuminate\Support\Facades\DB::update('update clientes set exibir_no_site = true where id = 95845');
    $c = App\Models\Cliente::find(95845);
    $c->exibir_no_site = false;
    $c->save();
    echo "Saved false natively!\n";
} catch (\Exception $e) {
    echo "Error saving false: " . $e->getMessage() . "\n";
}
