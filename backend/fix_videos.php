<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;

$clientes = Cliente::where('video', 'like', '%<iframe%')->get();
$fixedCount = 0;

foreach ($clientes as $c) {
    if (preg_match('/src=["\']([^"\']+)["\']/', $c->video, $matches)) {
        $url = $matches[1];
        $c->video = $url;
        $c->save();
        $fixedCount++;
        echo "Fixed {$c->id}: {$url}\n";
    }
}

echo "Total fixed: $fixedCount\n";
