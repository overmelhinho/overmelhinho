<?php
$invoices = DB::table('invoices')->where('client_id', 109956)->get();
foreach($invoices as $inv) {
    echo $inv->id . " - " . $inv->status . " - " . $inv->due_date . "\n";
}
