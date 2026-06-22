<?php
$c = DB::table('clientes')->where('nome_fantasia', 'ilike', '%Retokar%')->first();
$invoices = DB::table('invoices')->where('client_id', $c->id)->orderBy('due_date', 'desc')->get();
foreach($invoices as $inv) {
    echo "{$inv->id} - {$inv->status} - {$inv->due_date}\n";
}
