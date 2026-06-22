<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$auths = \App\Models\Autorizacao::where('numero', 'like', '%25918%')->get();
echo "Found " . $auths->count() . " authorizations with number 25918:\n";
foreach ($auths as $a) {
    echo "ID: {$a->id} | Numero: {$a->numero} | Cliente ID: {$a->cliente_id} | Status: {$a->status} | Created: {$a->created_at}\n";
}
