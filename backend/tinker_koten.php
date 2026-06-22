<?php
$c = \App\Models\Cliente::where('nome_fantasia', 'like', '%Koten%')->with('galeriaImagens')->get();
$sourceId = null;
$targetId = null;

foreach($c as $cl) {
    echo $cl->id . ' - ' . $cl->nome_fantasia . ' - Images count: ' . $cl->galeriaImagens->count() . "\n";
    if ($cl->galeriaImagens->count() > 0) {
        $sourceId = $cl->id;
    } else {
        $targetId = $cl->id;
    }
}

if ($sourceId && $targetId) {
    $images = \App\Models\GaleriaImagem::where('cliente_id', $sourceId)->get();
    foreach($images as $img) {
        $newImg = $img->replicate();
        $newImg->cliente_id = $targetId;
        $newImg->save();
    }
    echo "Copied " . $images->count() . " images from client $sourceId to client $targetId.\n";
} else {
    echo "Could not determine source or target, or no images found to copy.\n";
}
