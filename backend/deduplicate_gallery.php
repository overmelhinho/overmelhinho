<?php
use App\Models\GaleriaImagem;

echo "Iniciando deduplicação de imagens de galeria...\n";

$clientesIds = GaleriaImagem::select('cliente_id')->distinct()->pluck('cliente_id');
$totalDeletadas = 0;

foreach ($clientesIds as $clienteId) {
    // Pega as imagens ordenadas pela ordem atual e ID
    $imagens = GaleriaImagem::where('cliente_id', $clienteId)
                ->orderBy('ordem', 'asc')
                ->orderBy('id', 'asc')
                ->get();
    
    $urlsVistas = [];
    $ordemAtual = 0;
    
    foreach ($imagens as $img) {
        // Usa o basename (nome do arquivo) para identificar duplicatas 
        // caso haja diferença de domínio na string completa
        $fileName = basename(parse_url($img->url, PHP_URL_PATH));
        
        if (in_array($fileName, $urlsVistas)) {
            // Já vimos esta imagem para este cliente, deletar duplicada no banco
            $img->delete();
            $totalDeletadas++;
        } else {
            // Nova imagem
            $urlsVistas[] = $fileName;
            
            // Corrige a ordem para ficar contínua (0, 1, 2, 3...)
            if ($img->ordem !== $ordemAtual) {
                // Necessário usar Query Builder porque timestamps = false mas o eloquent pode dar dor de cabeça
                GaleriaImagem::where('id', $img->id)->update(['ordem' => $ordemAtual]);
            }
            $ordemAtual++;
        }
    }
}

echo "Finalizado! Total de imagens duplicadas removidas do banco de dados: $totalDeletadas\n";
