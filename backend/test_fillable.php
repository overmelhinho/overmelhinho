<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$a = \App\Models\Autorizacao::where('numero', '25917')->first();
if($a) {
    $a->update(['tiny_needs_manual_cancellation' => 'true']);
    echo 'OK!';
}
