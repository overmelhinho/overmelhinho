<?php
$c = \App\Models\Cliente::whereHas('enderecos', function($q){
    $q->where('rua', 'ilike', '%Independência%')
      ->where('numero', 'like', '%481%');
})->orWhereHas('contatos', function($q) {
    $q->where('telefone_principal', 'like', '%34012491%')
      ->orWhere('telefone_principal', 'like', '%3401-2491%');
})->with('enderecos')->get();

foreach($c as $cl) {
    echo $cl->id . ' - ' . $cl->nome_fantasia . ' - ' . $cl->razao_social . "\n";
    foreach($cl->enderecos as $e) {
        echo "   Endereço: " . $e->rua . ", " . $e->numero . " - " . $e->cidade . "\n";
    }
}
