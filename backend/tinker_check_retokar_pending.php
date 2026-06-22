<?php
$c = DB::table('clientes')->where('nome_fantasia', 'ilike', '%Retokar%')->first();
$invoices = DB::table('invoices')->where('client_id', $c->id)->where('status', 'pending')->get();
echo "Pending invoices for Retokar: " . count($invoices) . "\n";
