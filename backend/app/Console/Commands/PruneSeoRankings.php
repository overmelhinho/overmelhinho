<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SeoRanking;
use Illuminate\Support\Facades\Log;

class PruneSeoRankings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seo:prune-rankings {--days=60 : Número de dias para manter o histórico}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpa o histórico de posições SEO antigas para evitar sobrecarga no banco de dados.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        
        $this->info("Iniciando limpeza de registros de SEO mais antigos que {$days} dias...");
        
        $dateThreshold = now()->subDays($days);
        
        // Deleta em chunks para evitar table lock e memory exhaustion (apenas para segurança)
        $deletedTotal = 0;
        
        do {
            $deleted = SeoRanking::where('created_at', '<', $dateThreshold)
                ->limit(5000)
                ->delete();
                
            $deletedTotal += $deleted;
            
            $this->info("Deletados {$deleted} registros...");
            
            // Pausa de 1 segundo para o banco "respirar"
            sleep(1);
            
        } while ($deleted > 0);

        Log::info("Limpeza de SEO concluída. Total deletado: {$deletedTotal} registros.");
        $this->info("Concluído! {$deletedTotal} registros antigos foram apagados.");
    }
}
