<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $c = App\Models\Cliente::first();
    $c->exibir_no_site = false;
    $c->save();
    echo "Saved property natively!\n";
} catch (\Exception $e) {
    echo "Error saving natively: " . $e->getMessage() . "\n";
}
