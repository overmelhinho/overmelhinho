<?php
$c = DB::table('clientes')->where('nome_fantasia', 'ilike', '%Friotec%')->first();
echo "Friotec status: {$c->status_assinatura}\n";
