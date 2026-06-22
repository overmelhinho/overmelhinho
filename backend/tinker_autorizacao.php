<?php
$autos = \Illuminate\Support\Facades\DB::table('autorizacoes')->where('numero', 'like', '25837%')->get();
foreach($autos as $a) {
    echo $a->numero . ' - ' . $a->titulo_anuncio . "\n";
}
