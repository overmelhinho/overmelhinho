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

        \App\Models\Cliente::chunk(50, function ($clientes) use (&$delay, &$count) {
            foreach ($clientes as $cliente) {
                // Enfileira o job. Atrasamos cada execução em 5 segundos progressivamente 
                // para evitar sobrecarregar a API do Google (rate-limit)
                \App\Jobs\ProcessClienteSeoJob::dispatch($cliente)->delay(now()->addSeconds($delay));
                $delay += 5;
                $count++;
            }
        });

        $this->info("Checagem finalizada! {$count} clientes foram enviados para a fila de processamento.");
    }
}

