<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Lead;
use App\Models\Cliente;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CleanUpE2ETestData extends Command
{
    protected $signature = 'e2e:cleanup';
    protected $description = 'Clean up all temporary E2E/Robot test data from the database';

    public function handle()
    {
        $this->info("🧹 Starting E2E test data cleanup...");

        try {
            DB::beginTransaction();

            // 1. Delete Job Opportunities (Vagas) containing E2E or Robot
            if (Schema::hasTable('job_opportunities')) {
                $vagasDeleted = DB::table('job_opportunities')
                    ->where('title', 'LIKE', '%E2E%')
                    ->orWhere('title', 'LIKE', '%Robot%')
                    ->delete();
                $this->line("🗑️ Deleted {$vagasDeleted} Job Opportunities (Vagas) from job_opportunities.");
            }

            // 2. Delete Campanhas containing E2E or Robot
            if (Schema::hasTable('campanhas')) {
                // Delete related records first
                $campanhasIds = DB::table('campanhas')
                    ->where('nome', 'LIKE', '%E2E%')
                    ->orWhere('nome', 'LIKE', '%Robot%')
                    ->pluck('id');

                if ($campanhasIds->isNotEmpty()) {
                    if (Schema::hasTable('campanha_cidades')) {
                        DB::table('campanha_cidades')->whereIn('campanha_id', $campanhasIds)->delete();
                    }
                    if (Schema::hasTable('campanha_keywords')) {
                        DB::table('campanha_keywords')->whereIn('campanha_id', $campanhasIds)->delete();
                    }
                    if (Schema::hasTable('campanha_midias')) {
                        DB::table('campanha_midias')->whereIn('campanha_id', $campanhasIds)->delete();
                    }
                    if (Schema::hasTable('campanha_financeiro')) {
                        DB::table('campanha_financeiro')->whereIn('campanha_id', $campanhasIds)->delete();
                    }
                    $campanhasDeleted = DB::table('campanhas')->whereIn('id', $campanhasIds)->delete();
                    $this->line("🗑️ Deleted {$campanhasDeleted} Campanhas (including related tables).");
                }
            }

            // 3. Delete Clientes containing E2E or Robot
            $clientes = Cliente::where('nome_fantasia', 'LIKE', '%E2E%')
                ->orWhere('nome_fantasia', 'LIKE', '%Robot%')
                ->orWhere('razao_social', 'LIKE', '%E2E%')
                ->orWhere('razao_social', 'LIKE', '%Robot%')
                ->get();

            $clientesCount = $clientes->count();
            foreach ($clientes as $cliente) {
                // Delete related contacts manually to prevent foreign key constraint issues
                $cliente->contatos()->delete();
                // Delete related addresses
                $cliente->enderecos()->delete();
                // Delete the client
                $cliente->delete();
            }
            $this->line("🗑️ Deleted {$clientesCount} Clientes (including their contatos and enderecos).");

            // 4. Delete Leads containing E2E or Robot
            $leadsDeleted = Lead::where('nome', 'LIKE', '%E2E%')
                ->orWhere('nome', 'LIKE', '%Robot%')
                ->orWhere('email', 'LIKE', '%e2e%')
                ->orWhere('email', 'LIKE', '%robot%')
                ->delete();
            $this->line("🗑️ Deleted {$leadsDeleted} Leads.");

            DB::commit();
            $this->info("✅ E2E test data cleanup completed successfully.");
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error("❌ Error during E2E cleanup: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
