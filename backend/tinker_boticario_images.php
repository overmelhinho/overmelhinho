<?php
$c = \App\Models\Cliente::where('nome_fantasia', 'like', '%Botic%')->with('galeriaImagens')->get();
foreach($c as $cl) {
    echo $cl->id . ' - ' . $cl->nome_fantasia . ' - Images count: ' . $cl->galeriaImagens->count() . "\n";
}
