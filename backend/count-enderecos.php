<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Endereco;
use Illuminate\Support\Facades\DB;

$countEmptyRua = Endereco::where(function($query) {
    $query->whereNull('rua')->orWhere('rua', '');
})->count();

$countEmptyBairro = Endereco::where(function($query) {
    $query->whereNull('bairro')->orWhere('bairro', '');
})->count();

echo "Endereços com RUA vazia: $countEmptyRua\n";
echo "Endereços com BAIRRO vazio: $countEmptyBairro\n";
