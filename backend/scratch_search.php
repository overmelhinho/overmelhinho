<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$q = \App\Models\Cliente::query()
    ->where('exibir_no_site', true)
    ->where(function($sub) {
        $sub->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente'])
            ->orWhere('tipo_cliente', 'gratuito');
    })
    ->where('nome_fantasia', 'ilike', '%laura%')
    ->get(['id', 'nome_fantasia']);

file_put_contents(__DIR__.'/debug_search.txt', json_encode($q->toArray(), JSON_PRETTY_PRINT));
echo "Done.";
