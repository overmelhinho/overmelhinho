<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$start = microtime(true);
$res = \App\Models\Cliente::select(['id', 'slug', 'updated_at'])
    ->where(function ($sub) {
        $sub->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente'])
            ->orWhere('tipo_cliente', 'gratuito');
    })
    ->where('exibir_no_site', 'true')
    ->get();

echo 'Time: ' . (microtime(true) - $start) . "s\n";
echo 'Count: ' . $res->count() . "\n";
echo 'Memory: ' . (memory_get_peak_usage(true) / 1024 / 1024) . " MB\n";
