<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$query = "
    SELECT 
        p.id as publicidade_id,
        p.num_autorizacao,
        p.id_cliente,
        p.valor as valor_total,
        pp.id as parcela_id,
        pp.valor as valor_parcela,
        COALESCE((SELECT SUM(valor_pago) FROM publicidades_parcelas_pagamentos WHERE id_parcela = pp.id), 0) as total_pago
    FROM publicidades p
    JOIN publicidades_parcelas pp ON pp.id_publicidade = p.id
    WHERE p.num_autorizacao IN (
        SELECT num_autorizacao 
        FROM publicidades 
        WHERE num_autorizacao IS NOT NULL AND num_autorizacao != '' 
        GROUP BY num_autorizacao 
        HAVING COUNT(id) > 1
    )
    HAVING (valor_parcela - total_pago) > 0.01
";

$results = DB::connection('legacy')->select($query);

$openByAuthNumber = [];
foreach($results as $r) {
    if (!isset($openByAuthNumber[$r->num_autorizacao])) {
        $openByAuthNumber[$r->num_autorizacao] = [
            'publicidades' => [],
            'total_em_aberto' => 0
        ];
    }
    
    if (!isset($openByAuthNumber[$r->num_autorizacao]['publicidades'][$r->publicidade_id])) {
        $openByAuthNumber[$r->num_autorizacao]['publicidades'][$r->publicidade_id] = [
            'id_cliente' => $r->id_cliente,
            'parcelas_em_aberto' => 0
        ];
    }
    
    $openByAuthNumber[$r->num_autorizacao]['publicidades'][$r->publicidade_id]['parcelas_em_aberto']++;
    $openByAuthNumber[$r->num_autorizacao]['total_em_aberto'] += ($r->valor_parcela - $r->total_pago);
}

echo json_encode([
    'total_duplicated_auths_with_open_installments' => count($openByAuthNumber),
    'samples' => array_slice($openByAuthNumber, 0, 5, true)
]);
