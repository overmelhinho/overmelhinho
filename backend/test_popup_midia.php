<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\CampanhaMidia;

$m = CampanhaMidia::where('meta_json->placement', 'POPUP_GLOBAL')->first();
echo json_encode($m, JSON_PRETTY_PRINT);
