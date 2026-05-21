<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$req = new Illuminate\Http\Request(['cidade' => 'Farroupilha', 'segmento' => 'Joalherias']);
$c = app(App\Http\Controllers\Api\V1\ProspectController::class);
$res = $c->search($req);
echo json_encode($res->getData(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
