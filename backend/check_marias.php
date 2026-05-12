<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$marias = User::where('name', 'like', '%Maria%')->get();
foreach ($marias as $u) {
    echo "ID: {$u->id}, Name: {$u->name}, Roles: " . $u->getRoleNames()->implode(', ') . "\n";
}
