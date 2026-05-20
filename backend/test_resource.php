<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \App\Models\Cliente::where('nome_fantasia', 'ilike', '%Farroupilha%')->first();
$resource = new \App\Http\Resources\ClienteResource($c);
$req = \Illuminate\Http\Request::create('/');
echo json_encode($resource->toArray($req), JSON_PRETTY_PRINT);
