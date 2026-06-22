<?php
// Deletar as imagens antigas/incorretas (2)
\App\Models\GaleriaImagem::where('cliente_id', 21232)->delete();

// Copiar as 12 da matriz (40092) para a filial (21232)
$images = \App\Models\GaleriaImagem::where('cliente_id', 40092)->get();
foreach($images as $img) {
    $newImg = $img->replicate();
    $newImg->cliente_id = 21232;
    $newImg->save();
}

echo "Substituido as imagens. Agora o cliente 21232 tem " . $images->count() . " imagens iguais à matriz.\n";
