<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Autorizacao;
use App\Services\TinyErpService;
use App\Http\Controllers\Api\V1\AutorizacaoController;

class SyncMissingInvoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoices:sync-missing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica se existem autorizações assinadas sem faturas geradas e sincroniza automaticamente.';

    /**
     * Execute the console command.
     */
    public function handle(TinyErpService $tinyService)
    {
        $this->info('Iniciando verificação de faturas faltantes em autorizações assinadas...');

        // Busca autorizações com status assinado onde parcelas não têm faturas geradas.
        $autorizacoes = Autorizacao::with(['parcelas', 'cliente'])
            ->where('status', 'assinado')
            ->where('valor_total', '>', 0)
            ->whereHas('parcelas', function ($query) {
                $query->whereNull('invoice_id');
            })
            ->get();

        if ($autorizacoes->isEmpty()) {
            $this->info('Tudo certo! Nenhuma autorização com faturas pendentes encontrada.');
            return 0;
        }

        $controller = app(AutorizacaoController::class);
        $count = 0;

        foreach ($autorizacoes as $aut) {
            $this->info("Gerando faturas para a autorização #{$aut->numero}...");
            
            try {
                // Call public method processInvoiceGeneration
                $result = $controller->processInvoiceGeneration($aut, $tinyService);
                
                $created = count($result['created'] ?? []);
                $synced = count($result['synced'] ?? []);
                
                $this->info("Sucesso! Autorização #{$aut->numero}: {$created} faturas criadas, {$synced} sincronizadas no Tiny.");
                $count++;
            } catch (\Exception $e) {
                $this->error("Erro na autorização #{$aut->numero}: " . $e->getMessage());
                \Log::error("Erro no comando invoices:sync-missing para autorização #{$aut->id}: " . $e->getMessage());
            }
        }

        $this->info("Verificação concluída. {$count} autorizações corrigidas.");
        return 0;
    }
}
