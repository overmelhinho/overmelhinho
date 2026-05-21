<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $c = App\Models\Cliente::first();
    echo "Before: " . json_encode($c->exibir_no_site) . " (type: " . gettype($c->exibir_no_site) . ")\n";
    // Force direct DB update to false
    \Illuminate\Support\Facades\DB::update('update clientes set exibir_no_site = false where id = ?', [$c->id]);
    
    // Refresh model
    $c = App\Models\Cliente::first();
    echo "After DB false: " . json_encode($c->exibir_no_site) . " (type: " . gettype($c->exibir_no_site) . ")\n";
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
