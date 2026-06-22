<?php
$c = DB::table('clientes')->where('nome_fantasia', 'ilike', '%Retokar%')->first();
$auths = DB::table('autorizacoes')->where('cliente_id', $c->id)->pluck('id');
$invoices = DB::table('invoices')->whereIn('group_id', $auths->map(fn($id) => "autorizacao-$id"))->get();
echo "Auths: " . implode(',', $auths->toArray()) . "\n";
echo "Invoices count via group_id: " . $invoices->count() . "\n";
foreach($invoices as $inv) {
    if($inv->status == 'pending') {
        echo "Pending: {$inv->id} - {$inv->status} - {$inv->due_date} (Client: {$inv->client_id})\n";
    }
}
