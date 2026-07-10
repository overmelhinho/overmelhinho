<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Services\AuditAutomationService;
use Illuminate\Support\Facades\Log;

class AuditScanRoutine extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'audit:scan {--limit=10 : Quantidade de clientes para escanear}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Varredura automática de dados dos clientes na internet (IA)';

    protected AuditAutomationService $auditService;

    public function __construct(AuditAutomationService $auditService)
    {
        parent::__construct();
        $this->auditService = $auditService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $limit = $this->option('limit');
        $this->info("🔍 Iniciando rotina de auditoria externa (Limite: {$limit})...");

        // 1. Prioridade: Gratuitos que não foram auditados há mais de 6 meses
        // 2. Secundário: Pagantes que não foram auditados há mais de 6 meses
        $clientes = Cliente::where(function($q) {
                $q->whereNull('last_audit_at')
                  ->orWhere('last_audit_at', '<', now()->subMonths(6));
            })
            ->orderByRaw("CASE WHEN tipo_cliente = 'gratuito' THEN 0 ELSE 1 END")
            ->orderBy('last_audit_at', 'asc')
            ->limit($limit)
            ->get();

        if ($clientes->isEmpty()) {
            $this->info("✅ Nenhum cliente precisando de auditoria no momento.");
            return;
        }

        $bar = $this->output->createProgressBar(count($clientes));
        $bar->start();

        foreach ($clientes as $cliente) {
            try {
                $this->auditService->scan($cliente);
            } catch (\Exception $e) {
                Log::error("❌ Erro ao auditar cliente {$cliente->id}: " . $e->getMessage());
            }
            $bar->advance();
            
            // Pequeno delay para evitar bloqueio de API (Google/OpenAI) em massa
            usleep(500000); 
        }

        $bar->finish();
        $this->newLine();
        $this->info("🏁 Rotina concluída com sucesso.");
    }
}
