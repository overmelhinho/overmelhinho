<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$partials = DB::connection('legacy')->select("
    SELECT p.id_publicidade, p.valor as valor_parcela, SUM(pg.valor_pago) as total_pago 
    FROM publicidades_parcelas p 
    JOIN publicidades_parcelas_pagamentos pg ON pg.id_parcela = p.id 
    GROUP BY p.id, p.id_publicidade, p.valor 
    HAVING SUM(pg.valor_pago) < p.valor AND SUM(pg.valor_pago) > 0
");

$companies = [];
foreach ($partials as $p) {
    $auth = App\Models\Autorizacao::with('cliente')->find($p->id_publicidade);
    if ($auth && $auth->cliente) {
        $nome = $auth->cliente->nome_fantasia ?: $auth->cliente->razao_social;
        $restante = max(0, $p->valor_parcela - $p->total_pago);
        $companies[] = "- " . $nome . " (Total: R$ " . number_format($p->valor_parcela, 2, ',', '.') . " | Pago: R$ " . number_format($p->total_pago, 2, ',', '.') . " | Falta: R$ " . number_format($restante, 2, ',', '.') . ")";
    }
}

$companies = array_unique($companies);
echo implode("\n", $companies);
