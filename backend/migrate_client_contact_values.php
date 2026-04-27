<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Cliente;

echo "Migrando valores de preferência e turno na tabela clientes...\n";

$clientes = Cliente::all();
$count = 0;

$prefMap = [
    'presential' => 'presencial',
    'call' => 'ligacao',
    'whatsapp' => 'whatsapp',
    'email' => 'email'
];

$shiftMap = [
    'morning' => 'manha',
    'afternoon' => 'tarde',
    'both' => 'ambos'
];

foreach ($clientes as $c) {
    $updated = false;
    
    if (isset($prefMap[$c->contact_preference])) {
        $c->contact_preference = $prefMap[$c->contact_preference];
        $updated = true;
    }
    
    if (isset($shiftMap[$c->best_contact_shift])) {
        $c->best_contact_shift = $shiftMap[$c->best_contact_shift];
        $updated = true;
    }
    
    if ($updated) {
        $c->save();
        $count++;
    }
}

echo "Sucesso! $count clientes foram migrados para o novo padrão de valores.\n";
