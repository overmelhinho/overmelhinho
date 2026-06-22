<?php
$clientes = \App\Models\Cliente::where('tipo_cliente', 'gratuito')
    ->whereRaw('LENGTH(descricao) > 200')
    ->whereHas('invoices')
    ->get();

foreach ($clientes as $c) {
    echo $c->nome_fantasia . " - https://dash.overmelhinho.com.br/clientes/" . $c->id . "/editar\n";
}
