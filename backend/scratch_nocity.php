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
    ->where(function ($sub) {
        $q = 'laura';
        $sub->where('nome_fantasia', 'ilike', "%{$q}%")
            ->orWhere('nome_alternativo', 'ilike', "%{$q}%");
    })
    ->get(['id', 'nome_fantasia']);

file_put_contents(__DIR__.'/debug_search_nocity.txt', json_encode($q->toArray(), JSON_PRETTY_PRINT));
echo "Done.";
