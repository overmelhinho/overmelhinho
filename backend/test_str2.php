<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\Illuminate\Support\Facades\DB::enableQueryLog();
try {
    $c = App\Models\Cliente::first();
    $c->update(['exibir_no_site' => 'true']);
    $c->update(['exibir_no_site' => 'false']);
    echo "Saved string successfully\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
print_r(\Illuminate\Support\Facades\DB::getQueryLog());
