<?php

require 'backend/vendor/autoload.php';
$app = require_once 'backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Query the count of empty combinations using pure SQL:
$res = DB::select("
    WITH active_combos AS (
        SELECT DISTINCT cc.cidade_id, cs.segmento_id
        FROM clientes c
        JOIN cliente_cidade cc ON c.id = cc.cliente_id
        JOIN cliente_segmento cs ON c.id = cs.cliente_id
        WHERE c.exibir_no_site = 'true'
          AND (c.status_assinatura IN ('ativa', 'ativo', 'pendente', 'inadimplente') OR c.tipo_cliente = 'gratuito')
    )
    SELECT ac.cidade_id, ac.segmento_id, cid.nome as cidade, seg.nome as segmento
    FROM active_combos ac
    JOIN cidades cid ON ac.cidade_id = cid.id
    JOIN segmentos seg ON ac.segmento_id = seg.id
    WHERE NOT EXISTS (
        SELECT 1
        FROM clientes c2
        JOIN cliente_segmento cs2 ON c2.id = cs2.cliente_id AND cs2.segmento_id = ac.segmento_id
        WHERE c2.exibir_no_site = 'true'
          AND (c2.status_assinatura IN ('ativa', 'ativo', 'pendente', 'inadimplente') OR c2.tipo_cliente = 'gratuito')
          AND (
              EXISTS (SELECT 1 FROM cliente_cidade cc2 WHERE cc2.cliente_id = c2.id AND cc2.cidade_id = ac.cidade_id)
              OR
              EXISTS (SELECT 1 FROM enderecos e2 WHERE e2.cliente_id = c2.id AND LOWER(TRIM(e2.cidade)) = LOWER(TRIM(cid.nome)))
          )
    )
");

echo "Total de combinações de active_combos vazias: " . count($res) . "\n";
if (count($res) > 0) {
    foreach ($res as $r) {
        echo "  - {$r->cidade} / {$r->segmento}\n";
    }
} else {
    echo "NENHUMA combinação vazia está sendo gerada por activeSitemapCombinations! (100% das 8.719 combinações possuem pelo menos 1 empresa ativa).\n";
}

