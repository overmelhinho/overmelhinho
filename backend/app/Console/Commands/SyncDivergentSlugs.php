<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Services\SlugService;

class SyncDivergentSlugs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clientes:sync-divergent-slugs {--dry-run : Apenas exibe as mudanças sem gravar} {--id= : Sincroniza apenas um cliente específico por ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza slugs de clientes que ficaram divergentes do nome fantasia, registrando 301 no audit_log';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $id = $this->option('id');

        $query = Cliente::query();
        if ($id) {
            $query->where('id', $id);
        }

        $clientes = $query->get(['id', 'nome_fantasia', 'slug']);
        $total = $clientes->count();
        $this->info("Analisando {$total} clientes...");

        $divergent = [];

        foreach ($clientes as $c) {
            if (empty($c->nome_fantasia)) {
                continue;
            }

            $expectedSlug = SlugService::create($c->nome_fantasia);

            if (empty($c->slug)) {
                $divergent[] = [
                    'id' => $c->id,
                    'nome' => $c->nome_fantasia,
                    'old_slug' => '(vazio)',
                    'new_slug' => $expectedSlug,
                    'model' => $c
                ];
                continue;
            }

            $baseCurrent = preg_replace('/-\d+$/', '', $c->slug);
            $baseExpected = preg_replace('/-\d+$/', '', $expectedSlug);

            if ($baseCurrent !== $baseExpected && !str_starts_with($baseCurrent, $baseExpected) && !str_starts_with($baseExpected, $baseCurrent)) {
                $divergent[] = [
                    'id' => $c->id,
                    'nome' => $c->nome_fantasia,
                    'old_slug' => $c->slug,
                    'new_slug' => $expectedSlug,
                    'model' => $c
                ];
            }
        }

        $count = count($divergent);
        $this->info("Encontrados {$count} clientes com slugs divergentes.");

        if ($count === 0) {
            $this->info("Todos os slugs estão sincronizados!");
            return 0;
        }

        $tableData = array_map(function ($item) {
            return [
                'ID' => $item['id'],
                'Nome Fantasia' => mb_strimwidth($item['nome'], 0, 35, '...'),
                'Slug Atual' => $item['old_slug'],
                'Slug Novo' => $item['new_slug']
            ];
        }, array_slice($divergent, 0, 20));

        $this->table(['ID', 'Nome Fantasia', 'Slug Atual', 'Slug Novo'], $tableData);
        if ($count > 20) {
            $this->comment("... e mais " . ($count - 20) . " clientes.");
        }

        if ($dryRun) {
            $this->warn("Modo DRY-RUN: Nenhuma alteração foi realizada no banco.");
            return 0;
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $updated = 0;
        foreach ($divergent as $item) {
            $model = Cliente::find($item['id']);
            if ($model) {
                // Ao salvar, o saving hook do Cliente atualiza o slug, limpa o cache e grava o audit_log para redirecionamento 301
                $model->save();
                $updated++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Sucesso! {$updated} slugs atualizados com histórico de redirecionamento 301.");

        return 0;
    }
}

