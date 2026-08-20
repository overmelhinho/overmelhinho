<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class EnableRLSSupabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'supabase:enable-rls';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ativa o Row-Level Security (RLS) em todas as tabelas do schema public para fechar brechas do PostgREST (Supabase)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Buscando tabelas no schema public...");

        // Pega todas as tabelas do schema public
        $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");

        if (empty($tables)) {
            $this->warn("Nenhuma tabela encontrada no schema public.");
            return;
        }

        $this->info("Foram encontradas " . count($tables) . " tabelas. Ativando RLS em todas...");

        $bar = $this->output->createProgressBar(count($tables));
        $bar->start();

        foreach ($tables as $table) {
            $tableName = $table->tablename;
            try {
                DB::statement("ALTER TABLE \"{$tableName}\" ENABLE ROW LEVEL SECURITY;");
                // Avança a barra
                $bar->advance();
            } catch (\Exception $e) {
                $this->error("\nErro ao ativar RLS na tabela {$tableName}: " . $e->getMessage());
            }
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('✅ RLS ativado com sucesso em todas as tabelas do schema public!');
        $this->info('A API pública do Supabase agora está bloqueada e o Laravel continua funcionando normalmente.');
    }
}
