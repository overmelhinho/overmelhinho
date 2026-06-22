<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Laravel\Sanctum\Sanctum;

$admin = User::where('email', 'admin@overmelhinho.com.br')->first();
if (!$admin) {
    echo "Admin user not found.\n";
    exit;
}

// Generate token or act as admin
Sanctum::actingAs($admin, ['*']);

$response = $app->make(Illuminate\Contracts\Http\Kernel::class)->handle(
    Illuminate\Http\Request::create('/api/v1/comerciais', 'GET')
);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
