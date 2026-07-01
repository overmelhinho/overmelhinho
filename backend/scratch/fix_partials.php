<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$partials = DB::connection('legacy')->select("
    SELECT p.id, p.valor as valor_parcela, SUM(pg.valor_pago) as total_pago 
    FROM publicidades_parcelas p 
    JOIN publicidades_parcelas_pagamentos pg ON pg.id_parcela = p.id 
    GROUP BY p.id, p.valor 
    HAVING SUM(pg.valor_pago) < p.valor AND SUM(pg.valor_pago) > 0
");

echo "Encontradas " . count($partials) . " parcelas pagas parcialmente.\n";

$count = 0;
foreach ($partials as $p) {
    $restante = round(max(0, $p->valor_parcela - $p->total_pago), 2);
    
    // Atualizar autorizacao_parcelas
    DB::table('autorizacao_parcelas')
        ->where('id', $p->id)
        ->update([
            'status' => 'pendente',
            'payable_amount' => $restante
        ]);
        
    $ap = DB::table('autorizacao_parcelas')->where('id', $p->id)->first();
    if ($ap && $ap->invoice_id) {
        DB::table('invoices')
            ->where('id', $ap->invoice_id)
            ->update([
                'status' => 'pending',
                'payable_amount' => $restante
            ]);
        $count++;
    }
}

echo "Atualizadas $count invoices para pagamentos parciais!\n";

// E para o frontend exibir esse valor pago, podemos garantir que o payable_amount
// seja refletido corretamente no sistema.
