<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $c = App\Models\Cliente::first();
    $c->update(['exibir_no_site' => false]);
    echo "Saved false successfully via update()\n";
} catch (\Exception $e) {
    echo "Error saving false: " . $e->getMessage() . "\n";
}
