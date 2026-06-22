<?php
$c = DB::table('clientes')->where('nome_fantasia', 'ilike', '%Retokar%')->get();
foreach($c as $client) {
    echo "{$client->id} - {$client->nome_fantasia}\n";
}
