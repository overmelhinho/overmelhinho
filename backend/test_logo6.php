<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \App\Models\Cliente::where('nome_fantasia', 'ilike', '%São Bento%')->first();
if ($c) {
    $c->logo_url = 'test.jpg';
    $c->save();
    echo "Updated Sao Bento logo to test.jpg\n";
}
