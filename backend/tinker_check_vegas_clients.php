<?php
$clientes = DB::table('clientes')->where('nome_fantasia', 'ilike', '%Vegas%')->get();
foreach($clientes as $c) {
    echo $c->id . " - " . $c->nome_fantasia . " - " . $c->tipo_cliente . " - " . $c->status_assinatura . "\n";
    $invoices = DB::table('invoices')->where('client_id', $c->id)->count();
    echo "  Invoices: " . $invoices . "\n";
}
