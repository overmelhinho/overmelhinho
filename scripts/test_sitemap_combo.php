<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$count = \App\Models\Cliente::where('nome_fantasia', 'like', '%Alpha%')->orWhere('nome_fantasia', 'like', '%TESTE_TEMP%')->delete();
echo "Deletados: {$count}\n";
