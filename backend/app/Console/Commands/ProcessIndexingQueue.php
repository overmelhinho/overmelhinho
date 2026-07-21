<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\GoogleIndexingService;
use Illuminate\Support\Facades\DB;

class ProcessIndexingQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seo:process-indexing-queue {--limit=200 : O número máximo de URLs para processar nesta execução}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Consome as URLs pendentes da fila e envia para a Google Indexing API.';

    /**
     * Execute the console command.
     */
    public function handle(GoogleIndexingService $indexingService)
    {
        $limit = (int) $this->option('limit');
        $this->info("🚀 Iniciando processamento da fila de indexação (Limite: {$limit} URLs)...");

        $items = DB::table('seo_indexing_queue')
            ->where('status', 'pending')
            ->limit($limit)
            ->get();

        $total = $items->count();
        if ($total === 0) {
            $this->info("✅ Nenhuma URL pendente na fila de indexação.");
            return 0;
        }

        $this->info("📡 Encontradas {$total} URLs pendentes. Enviando para o Google...");

        $successCount = 0;
        $failedCount = 0;

        foreach ($items as $item) {
            $this->line("Enviando: {$item->url}");

            $success = $indexingService->updateUrl($item->url);

            if ($success) {
                DB::table('seo_indexing_queue')
                    ->where('id', $item->id)
                    ->update([
                        'status' => 'success',
                        'last_attempt_at' => now(),
                        'error_message' => null,
                        'updated_at' => now(),
                    ]);
                $successCount++;
                $this->info("  ➔ SUCESSO");
            } else {
                $errorMsg = $indexingService->getLastError();
                DB::table('seo_indexing_queue')
                    ->where('id', $item->id)
                    ->update([
                        'status' => 'failed',
                        'last_attempt_at' => now(),
                        'error_message' => $errorMsg,
                        'updated_at' => now(),
                    ]);
                $failedCount++;
                $this->error("  ➔ FALHA: {$errorMsg}");
            }

            // Evitar rate limit (cota de segurança de 250ms por requisição)
            usleep(250000);
        }

        $this->info("\n--- RESUMO DO PROCESSAMENTO ---");
        $this->info("🟢 Sucesso: {$successCount}");
        if ($failedCount > 0) {
            $this->error("🔴 Falhas: {$failedCount}");
        }
        $this->info("--------------------------------");

        return 0;
    }
}
