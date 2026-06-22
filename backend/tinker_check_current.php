<?php
$names = ['Retokar', 'Rodrigues Serviços', 'Smartmove', 'Friotec'];
foreach($names as $name) {
    $c = DB::table('clientes')->where('nome_fantasia', 'ilike', "%$name%")->first();
    if($c) {
        echo "{$c->nome_fantasia} - {$c->tipo_cliente} - {$c->status_assinatura}\n";
    }
}
