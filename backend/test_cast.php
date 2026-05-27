<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$a = \App\Models\Autorizacao::find(41301);
$a->update(['tiny_needs_manual_cancellation' => 'true']);
echo "Restored to true.\n";
