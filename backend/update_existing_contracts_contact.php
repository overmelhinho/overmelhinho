<?php

use App\Models\Autorizacao;
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Iniciando atualização de contratos existentes...\n";

$autorizacoes = Autorizacao::with(['cliente.contatos'])->get();
$count = 0;

foreach ($autorizacoes as $a) {
    if (!$a->responsavel_nome && !$a->responsavel_preferencia && !$a->responsavel_turno) {
        $a->update([
            'responsavel_nome' => $a->cliente->contatos->first()?->nome_contato,
            'responsavel_preferencia' => $a->cliente->contact_preference,
            'responsavel_turno' => $a->cliente->best_contact_shift,
        ]);
        $count++;
    }
}

echo "Sucesso! $count contratos foram atualizados com os dados atuais dos clientes.\n";
