<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\GaleriaImagem;

class DeduplicateGaleria extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:deduplicate-galeria';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove imagens duplicadas das galerias dos clientes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando deduplicação de imagens de galeria...');

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
                        GaleriaImagem::where('id', $img->id)->update(['ordem' => $ordemAtual]);
                    }
                    $ordemAtual++;
                }
            }
        }

        $this->info("Finalizado! Total de imagens duplicadas removidas do banco de dados: $totalDeletadas");
    }
}
