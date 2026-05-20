<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$req = \Illuminate\Http\Request::create('/api/v1/public/clientes', 'GET', ['q' => 'desentupidora']);
$res = app(\App\Http\Controllers\Api\V1\ClienteController::class)->indexPublic($req);
$items = $res->resource->items();
if (count($items) > 0) {
    echo json_encode($items[0]->toArray($req), JSON_PRETTY_PRINT);
} else {
    echo "Empty results\n";
}
