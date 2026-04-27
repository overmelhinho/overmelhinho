<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$id = 4;
$c = \App\Models\Cliente::find($id);

if ($c) {
    echo "CLIENTE: " . $c->nome_fantasia . " (ID: $id)\n";
    echo "----------------------------------------\n";
    echo "DADOS NA TABELA 'CLIENTES':\n";
    echo "Responsável (campo responsavel): " . ($c->responsavel ?: 'Vazio') . "\n";
    echo "Preferência de Contato: " . ($c->contact_preference ?: 'Vazio') . "\n";
    echo "Melhor Turno: " . ($c->best_contact_shift ?: 'Vazio') . "\n";
    echo "Email: " . ($c->email ?: 'Vazio') . "\n";
    
    echo "\nDADOS NA TABELA 'CONTATOS' (Relacionamento):\n";
    $contatos = \App\Models\Contato::where('cliente_id', $id)->get();
    if ($contatos->count() > 0) {
        foreach ($contatos as $idx => $con) {
            echo "Contato #" . ($idx + 1) . ":\n";
            echo "  Nome Contato: " . ($con->nome_contato ?: 'Vazio') . "\n";
            echo "  Telefone Principal: " . ($con->telefone_principal ?: 'Vazio') . "\n";
            echo "  Celular: " . ($con->celular ?: 'Vazio') . "\n";
            echo "  Email Principal: " . ($con->email_principal ?: 'Vazio') . "\n";
            echo "  WhatsApp Selecionado: " . ($con->whatsapp_selected ?: 'Vazio') . "\n";
        }
    } else {
        echo "Nenhum registro na tabela 'contatos' para este cliente.\n";
    }
} else {
    echo "Cliente ID 4 não encontrado.\n";
}
