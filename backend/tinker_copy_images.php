<?php
$images = \App\Models\GaleriaImagem::where('cliente_id', 113193)->get();
foreach($images as $img) {
    $newImg = $img->replicate();
    $newImg->cliente_id = 38925;
    $newImg->save();
}
echo "Copied " . $images->count() . " images to client 38925.\n";
