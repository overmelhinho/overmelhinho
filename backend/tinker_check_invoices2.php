<?php
$inv = DB::table('invoices')->first();
print_r($inv);
$inv_vegas = DB::table('invoices')->where('client_id', 109956)->get();
echo "Vegas invoices count: " . count($inv_vegas) . "\n";
