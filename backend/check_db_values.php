<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$a = \App\Models\Autorizacao::orderBy('id', 'desc')->first();
if ($a) {
    echo "AUTORIZACAO:\n";
    echo "Numero: " . $a->numero . "\n";
    echo "Cliente ID: " . $a->cliente_id . "\n";
    echo "Responsavel: " . $a->responsavel_nome . "\n";
    echo "Preferencia: " . $a->responsavel_preferencia . "\n";
    echo "Turno: " . $a->responsavel_turno . "\n\n";
    
    $c = \App\Models\Cliente::find($a->cliente_id);
    if ($c) {
        echo "CLIENTE:\n";
        echo "Nome: " . $c->nome_fantasia . "\n";
        echo "Contact Preference (DB): " . ($c->contact_preference ?: 'Vazio') . "\n";
        echo "Best Contact Shift (DB): " . ($c->best_contact_shift ?: 'Vazio') . "\n";
    }
}
