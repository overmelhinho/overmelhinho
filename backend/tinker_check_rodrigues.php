<?php
$c = DB::table('clientes')->where('nome_fantasia', 'ilike', '%Rodrigues%Serv%')->first();
echo "Rodrigues status: {$c->status_assinatura}\n";
$invoices = DB::table('invoices')->where('client_id', $c->id)->where('status', 'pending')->get();
foreach($invoices as $inv) {
    echo "Pending: {$inv->id} - {$inv->status} - {$inv->due_date}\n";
}
