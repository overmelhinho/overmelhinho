<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Autorizacao;

$angelica = User::where('name', 'like', '%Angélica%')->orWhere('name', 'like', '%Angelica%')->first();
if ($angelica) {
    echo "Angélica encontrada! ID: {$angelica->id} - Nome: {$angelica->name}\n";
} else {
    echo "Angélica não encontrada.\n";
}

$aut = Autorizacao::where('numero', '25978')->orWhere('numero', 'like', '%25978%')->first();
if ($aut) {
    echo "Autorização 25978 encontrada! ID: {$aut->id} - Vendedor atual: {$aut->vendedor_id}\n";
} else {
    echo "Autorização não encontrada.\n";
}
