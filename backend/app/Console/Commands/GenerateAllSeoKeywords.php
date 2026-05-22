<?php

namespace App\Console\Commands;

use App\Jobs\GenerateSeoKeywordsJob;
use App\Models\Cliente;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class GenerateAllSeoKeywords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seo:generate-all';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gera palavras-chave de SEO em lote usando a IA (Job) para clientes elegíveis.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Iniciando a geração de palavras-chave SEO em lote...");

        if (!Schema::hasColumn('clientes', 'seo_keywords')) {
            $this->error("Coluna 'seo_keywords' não encontrada na tabela 'clientes'.");
            return Command::FAILURE;
        }

        $hasSourceColumn = Schema::hasColumn('clientes', 'seo_keywords_source');

        // Busca clientes elegíveis (apenas ativos/aprovados se quiser, mas para SEO geramos para todos que não sejam manuais)
        $query = Cliente::query();

        if ($hasSourceColumn) {
            $query->where(function ($q) {
                $q->whereNull('seo_keywords_source')
                  ->orWhere('seo_keywords_source', '!=', 'manual');
            });
        }

        $total = $query->count();
        $this->info("Total de clientes elegíveis: {$total}");

        if ($total === 0) {
            $this->info("Nenhum cliente para processar.");
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $processed = 0;
        $skipped = 0;

        $query->chunkById(100, function ($clientes) use ($bar, &$processed, &$skipped) {
            foreach ($clientes as $cliente) {
                try {
                    // Executa o mesmo código do painel Admin para gerar as palavras semânticas
                    GenerateSeoKeywordsJob::dispatchSync($cliente->id);
                    $processed++;
                } catch (\Exception $e) {
                    $skipped++;
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->info("Concluído!");
        $this->line("Processados com sucesso: <info>{$processed}</info>");
        if ($skipped > 0) {
            $this->line("Falhas/Ignorados: <error>{$skipped}</error>");
        }

        return Command::SUCCESS;
    }
}
