<?php
$images = \App\Models\GaleriaImagem::where('cliente_id', 40092)->get();
foreach($images as $img) {
    echo $img->url . "\n";
}
