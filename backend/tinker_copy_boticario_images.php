<?php
$images = \App\Models\GaleriaImagem::where('cliente_id', 40092)->get();
foreach($images as $img) {
    $newImg = $img->replicate();
    $newImg->cliente_id = 43;
    $newImg->save();
}
echo "Copied " . $images->count() . " images from client 40092 to 43.\n";
