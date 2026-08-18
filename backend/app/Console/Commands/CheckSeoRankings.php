<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Models\SeoRanking;
use App\Models\Ticket;
use App\Models\User;
use App\Services\GoogleSearchConsoleService;

class CheckSeoRankings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seo:check-rankings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Busca o ranqueamento SEO real via Google Search Console ou simula se a API não estiver configurada.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Iniciando enfileiramento de checagem de SEO (via Google Search Console)...");

        $delay = 0;
        $count = 0;
        
        // Fracionamento Diário (Achatar a curva): Divide os clientes em 7 grupos baseados no dia da semana.
        $dayOfWeek = now()->dayOfWeek; // 0 (Domingo) a 6 (Sábado)

        \App\Models\Cliente::where('exibir_no_site', 'true')
            ->whereRaw('MOD(id, 7) = ?', [$dayOfWeek])
            // Prioriza os clientes pagantes (ativos) para serem enviados primeiro para a fila
            ->orderByRaw("CASE WHEN status_assinatura IN ('ativa', 'ativo') THEN 1 ELSE 0 END DESC")
            ->orderBy('id', 'asc')
            ->chunk(50, function ($clientes) use (&$delay, &$count) {
            foreach ($clientes as $cliente) {
                // Enfileira o job na fila dedicada (seo-background). 
                // Atrasamos a execução levemente para distribuir no worker.
                \App\Jobs\ProcessClienteSeoJob::dispatch($cliente)
                    ->onQueue('seo-background')
                    ->delay(now()->addSeconds($delay));
                    
                $delay += 2; // 2 segundos já é suficiente se tivermos um worker lento/rate limit configurado
                $count++;
            }
        });

        $this->info("Checagem finalizada! {$count} clientes foram enviados para a fila de processamento ('seo-background').");
    }
}

