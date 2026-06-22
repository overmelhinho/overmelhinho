<?php
$names = ['Retokar', 'Rodrigues Serviços', 'Smartmove', 'Friotec'];
foreach($names as $name) {
    $c = DB::table('clientes')->where('nome_fantasia', 'ilike', "%$name%")->first();
    if($c) {
        $count = DB::table('invoices')->where('client_id', $c->id)->where('status', 'pending')->where('due_date', '<', now()->format('Y-m-d'))->count();
        echo "{$c->nome_fantasia}: {$count} overdue pending invoices\n";
    }
}
