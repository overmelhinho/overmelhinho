<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$c = \DB::connection('legacy')->table('clientes')->first();
$k = array_keys((array)$c);
$f = array_filter($k, function($key) {
    return str_contains($key, '24') || str_contains($key, 'tele') || str_contains($key, 'meio') || str_contains($key, 'pgto') || str_contains($key, 'beneficio');
});
print_r($f);
