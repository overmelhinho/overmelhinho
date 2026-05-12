<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$q = \App\Models\Cliente::with('cidadesAtendidas', 'enderecos')->find(32);

file_put_contents(__DIR__.'/debug_laura_cidade.txt', json_encode($q->toArray(), JSON_PRETTY_PRINT));
echo "Done.";
