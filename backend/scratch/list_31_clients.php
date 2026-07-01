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
        c.pj_nome_fantasia as cliente_nome,
        p.valor as valor_total,
        pp.id as parcela_id,
        pp.valor as valor_parcela,
        COALESCE((SELECT SUM(valor_pago) FROM publicidades_parcelas_pagamentos WHERE id_parcela = pp.id), 0) as total_pago
    FROM publicidades p
    JOIN publicidades_parcelas pp ON pp.id_publicidade = p.id
    JOIN clientes c ON c.id = p.id_cliente
    WHERE p.num_autorizacao IN (
        SELECT num_autorizacao 
        FROM publicidades 
        WHERE num_autorizacao IS NOT NULL AND num_autorizacao != '' 
        GROUP BY num_autorizacao 
        HAVING COUNT(id) > 1
    )
    HAVING (valor_parcela - total_pago) > 0.01
    ORDER BY c.pj_nome_fantasia ASC
";

$results = DB::connection('legacy')->select($query);

$openByClient = [];
foreach($results as $r) {
    if (!isset($openByClient[$r->id_cliente])) {
        $openByClient[$r->id_cliente] = [
            'cliente_nome' => $r->cliente_nome,
            'autorizacoes_duplicadas' => []
        ];
    }
    
    if (!isset($openByClient[$r->id_cliente]['autorizacoes_duplicadas'][$r->num_autorizacao])) {
        $openByClient[$r->id_cliente]['autorizacoes_duplicadas'][$r->num_autorizacao] = [
            'publicidades_ids' => [],
            'parcelas_em_aberto' => 0,
            'total_em_aberto' => 0
        ];
    }
    
    $auth = &$openByClient[$r->id_cliente]['autorizacoes_duplicadas'][$r->num_autorizacao];
    
    if (!in_array($r->publicidade_id, $auth['publicidades_ids'])) {
        $auth['publicidades_ids'][] = $r->publicidade_id;
    }
    
    $auth['parcelas_em_aberto']++;
    $auth['total_em_aberto'] += ($r->valor_parcela - $r->total_pago);
}

echo "LISTA DOS 31 CASOS (CLIENTES COM AUTORIZAÇÕES DUPLICADAS E PARCELAS EM ABERTO)\n";
echo "=================================================================================\n\n";

foreach($openByClient as $clientId => $data) {
    $nome = $data['cliente_nome'] ?: 'Sem Nome Fantasia';
    echo "• Cliente: {$nome} (ID Legado: {$clientId})\n";
    foreach($data['autorizacoes_duplicadas'] as $num => $authInfo) {
        $ids = implode(', ', $authInfo['publicidades_ids']);
        echo "  - Aut. Duplicada Nº: {$num} (Publicidades IDs no Legado: {$ids})\n";
        echo "    Parcelas em aberto: {$authInfo['parcelas_em_aberto']} | Valor pendente: R$ " . number_format($authInfo['total_em_aberto'], 2, ',', '.') . "\n";
    }
    echo "\n";
}
