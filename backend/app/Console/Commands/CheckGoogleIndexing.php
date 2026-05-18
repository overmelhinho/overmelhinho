<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\GoogleIndexingService;

class CheckGoogleIndexing extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seo:check-indexing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica se a integração com a Google Indexing API está configurada corretamente.';

    /**
     * Execute the console command.
     */
    public function handle(GoogleIndexingService $indexingService)
    {
        $this->info("🔍 Verificando configuração da Google Indexing API...");

        $keyPath = config('services.google.indexing_key_path');

        if (!file_exists($keyPath)) {
            $this->error("❌ Arquivo de chave não encontrado: $keyPath");
            return 1;
        }

        $content = json_decode(file_get_contents($keyPath), true);
        if (isset($content['hint'])) {
            $this->warn("⚠️ O arquivo ainda contém o conteúdo de exemplo. Substitua pelo JSON real do Google.");
            return 1;
        }

        $this->info("✅ Arquivo JSON encontrado.");
        $this->info("📡 Tentando uma notificação de teste (Home)...");

        $url = config('app.frontend_url', 'https://novo.overmelhinho.com.br');
        $success = $indexingService->updateUrl($url);

        if ($success) {
            $this->info("🚀 SUCESSO! O Google recebeu a notificação de indexação.");
        } else {
            $this->error("❌ FALHA! Verifique os logs (storage/logs/laravel.log) para mais detalhes.");
            $this->line("Dica: Certifique-se de que o e-mail da conta de serviço foi adicionado como 'Proprietário' no Search Console.");
        }

        return 0;
    }
}
