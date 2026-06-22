<?php
$c = \App\Models\Cliente::where('nome_fantasia', 'ilike', '%botic%')
    ->orWhere('razao_social', 'ilike', '%Jmbeautify%')
    ->with('enderecos')
    ->get();

foreach($c as $cl) {
    echo $cl->id . ' - ' . $cl->nome_fantasia . ' - ' . $cl->tipo_cliente . ' - ' . $cl->status_assinatura . "\n";
    foreach($cl->enderecos as $e) {
        echo "   Endereço: " . $e->rua . ", " . $e->numero . " - " . $e->cidade . "\n";
    }
}
