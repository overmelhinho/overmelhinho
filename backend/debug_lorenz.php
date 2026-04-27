<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$c = \App\Models\Cliente::where('nome_fantasia', 'LIKE', '%LORENZ%')->first();
if ($c) {
    echo "CLIENTE: " . $c->nome_fantasia . "\n";
    echo "ID: " . $c->id . "\n";
    echo "Pref: " . ($c->contact_preference ?: 'Vazio') . "\n";
    echo "Turno: " . ($c->best_contact_shift ?: 'Vazio') . "\n";
    
    $a = \App\Models\Autorizacao::where('cliente_id', $c->id)->orderBy('id', 'desc')->first();
    if ($a) {
        echo "\nULTIMA AUTORIZACAO (#" . $a->numero . "):\n";
        echo "Responsavel: " . $a->responsavel_nome . "\n";
        echo "Preferencia: " . $a->responsavel_preferencia . "\n";
        echo "Turno: " . $a->responsavel_turno . "\n";
    } else {
        echo "\nNenhuma autorização encontrada para este cliente.\n";
    }
} else {
    echo "Cliente não encontrado.\n";
}
