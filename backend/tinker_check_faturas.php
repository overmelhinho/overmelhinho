<?php
$faturas = DB::table('faturas')->where('cliente_id', 109956)->get();
foreach($faturas as $f) {
    echo $f->id . " - " . $f->status . " - " . $f->data_vencimento . "\n";
}
