<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;
use App\Services\TinyErpService;

class ReconcileTinyInvoicesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tiny:reconcile-all 
                            {--days=30 : Quantidade de dias retroativos para filtrar faturas pagas locais} 
                            {--all-paid : Reconciliar todas as faturas pagas locais da história} 
                            {--start-date=2026-01-01 : Data de vencimento inicial para filtrar faturas (Y-m-d ou "all" para sem limite)}
                            {--limit= : Limitar a quantidade máxima de faturas a processar}
                            {--force : Executa o comando sem pedir confirmação do usuário}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reconcilia todas as faturas (pendentes e pagas recentes) de forma bidirecional com o Tiny ERP.';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle(TinyErpService $tinyService)
    {
        $this->info('=== INICIANDO VARREDURA DE RECONCILIAÇÃO COM TINY ERP ===');

        $startDate = $this->option('start-date');

        // 1. Seleciona faturas PENDENTES
        $queryPending = Invoice::where('status', 'pending')->with(['client', 'plan']);
        
        // 2. Seleciona faturas PAGAS (filtro ou todas)
        $queryPaid = Invoice::where('status', 'paid')->with(['client', 'plan']);
        
        if ($startDate !== 'all') {
            $queryPending->where('due_date', '>=', $startDate);
            $queryPaid->where('due_date', '>=', $startDate);
            $this->info("Filtrando faturas com vencimento a partir de: {$startDate}");
        } else {
            $this->warn("Atenção: Sem data limite de início. Analisando todo o histórico.");
        }

        if (!$this->option('all-paid')) {
            $days = (int)$this->option('days');
            $dateLimit = now()->subDays($days);
            $queryPaid->where('updated_at', '>=', $dateLimit);
            $this->info("Escopo de faturas pagas limitados às atualizadas nos últimos {$days} dias.");
        } else {
            $this->warn("Atenção: Reconciliando faturas pagas de todo o histórico. Isso pode demorar.");
        }

        $pendingCount = $queryPending->count();
        $paidCount = $queryPaid->count();

        $totalCount = $pendingCount + $paidCount;
        $this->info("Faturas pendentes locais: {$pendingCount}");
        $this->info("Faturas pagas locais: {$paidCount}");
        $this->info("Total de faturas a analisar: {$totalCount}");

        if ($totalCount === 0) {
            $this->info('Nenhuma fatura encontrada no escopo de reconciliação.');
            return 0;
        }

        // Confirmação (se não for forçado)
        if (!$this->option('force')) {
            if (!$this->confirm('Deseja iniciar a verificação e reconciliação em lote agora? (Note: haverá delay de 1s por fatura)')) {
                $this->info('Ação cancelada pelo usuário.');
                return 0;
            }
        }

        $limit = $this->option('limit') ? (int)$this->option('limit') : null;

        // Carregar as faturas em lote respeitando o limite
        if ($limit) {
            $pendingInvoices = $queryPending->limit($limit)->get();
            $remainingLimit = max(0, $limit - $pendingInvoices->count());
            $paidInvoices = $remainingLimit > 0 ? $queryPaid->limit($remainingLimit)->get() : collect();
            $invoices = $pendingInvoices->concat($paidInvoices);
            $totalCount = $invoices->count();
            $this->info("Limitando o processamento para as primeiras {$totalCount} faturas.");
        } else {
            $invoices = $queryPending->get()->concat($queryPaid->get());
        }

        $successCount = 0;
        $errorCount = 0;
        $skipCount = 0;
        $recreatedCount = 0;
        $statusSyncedCount = 0;

        foreach ($invoices as $index => $invoice) {
            $num = $index + 1;
            $this->line("--------------------------------------------------------------------------------");
            $this->info("[{$num}/{$totalCount}] Fatura #{$invoice->id} | Parcela: {$invoice->parcel_number}/{$invoice->total_parcels}");
            $this->line("Cliente: " . ($invoice->client->nome_fantasia ?? 'Sem Nome') . " (ID: {$invoice->client_id})");
            $this->line("Status Local: " . strtoupper($invoice->status) . " | Vencimento: " . date('d/m/Y', strtotime($invoice->due_date)));

            $valor = (float)($invoice->payable_amount ?? $invoice->amount);
            if ($valor <= 0) {
                $this->line("-> Ignorada (valor R$ 0 ou menor, ex: permuta total).");
                $skipCount++;
                continue;
            }

            try {
                // Caso 1: Fatura sem ID do Tiny ERP
                if (empty($invoice->tiny_account_id)) {
                    $this->line("-> Não possui ID no Tiny. Criando conta a receber no ERP...");
                    $tinyData = $tinyService->createReceivable($invoice, $valor);
                    
                    $invoice->update([
                        'tiny_account_id' => $tinyData['tiny_account_id'],
                        'payment_url'     => $tinyData['payment_url'],
                    ]);
                    $this->info("-> Criada com sucesso! Tiny ID: {$tinyData['tiny_account_id']}");
                    $recreatedCount++;

                    // Se já estiver paga localmente, dá baixa no Tiny
                    if ($invoice->status === 'paid') {
                        $this->line("-> Sincronizando status de pagamento: dando baixa no Tiny...");
                        $tinyService->payReceivable($tinyData['tiny_account_id'], $valor, 0);
                        $this->info("-> Baixa registrada no Tiny.");
                        $statusSyncedCount++;
                    }
                } 
                // Caso 2: Fatura com ID do Tiny ERP salvo
                else {
                    $this->line("-> Possui ID {$invoice->tiny_account_id}. Consultando situação no Tiny ERP...");
                    $tinyData = $tinyService->getReceivableStatus($invoice->tiny_account_id);

                    // 2a. ID órfão (não existe no Tiny)
                    if ($tinyData && isset($tinyData['not_found']) && $tinyData['not_found'] === true) {
                        $this->warn("-> ID {$invoice->tiny_account_id} não existe no Tiny (deletado ou inválido). Recriando...");
                        
                        $invoice->update([
                            'tiny_account_id' => null,
                            'payment_url'     => null,
                        ]);

                        $newTinyData = $tinyService->createReceivable($invoice, $valor);
                        $invoice->update([
                            'tiny_account_id' => $newTinyData['tiny_account_id'],
                            'payment_url'     => $newTinyData['payment_url'],
                        ]);
                        $this->info("-> Recriada com sucesso! Novo Tiny ID: {$newTinyData['tiny_account_id']}");
                        $recreatedCount++;

                        if ($invoice->status === 'paid') {
                            $this->line("-> Sincronizando status de pagamento: dando baixa no Tiny...");
                            $tinyService->payReceivable($newTinyData['tiny_account_id'], $valor, 0);
                            $this->info("-> Baixa registrada no Tiny.");
                            $statusSyncedCount++;
                        }
                    } 
                    // 2b. Existe no Tiny, valida situação de pagamento
                    elseif ($tinyData) {
                        $situacao = (string)($tinyData['situacao'] ?? '');
                        $isPaidInTiny = in_array($situacao, ['2'], true) 
                            || in_array(strtolower($situacao), ['pago', 'recebido'], true);

                        // Local PAGA | Tiny ABERTA ➔ Baixar no Tiny
                        if ($invoice->status === 'paid' && !$isPaidInTiny) {
                            $this->line("-> Local: PAGO | Tiny: ABERTO. Registrando baixa no Tiny...");
                            $tinyService->payReceivable($invoice->tiny_account_id, $valor, 0);
                            $this->info("-> Baixa registrada no Tiny.");
                            $statusSyncedCount++;
                        } 
                        // Local PENDENTE | Tiny PAGA ➔ Baixar localmente
                        elseif ($invoice->status === 'pending' && $isPaidInTiny) {
                            $this->line("-> Local: PENDENTE | Tiny: PAGO. Sincronizando baixa localmente...");
                            $invoice->update([
                                'status' => 'paid',
                                'justification' => 'Reconciliação total (baixado automaticamente via Tiny ERP)',
                                'action_date' => now(),
                            ]);
                            if ($invoice->client) {
                                $invoice->client->update(['status_assinatura' => 'ativo']);
                            }
                            $this->info("-> Baixa registrada localmente. Cliente ativado.");
                            $statusSyncedCount++;
                        } 
                        // Coerente
                        else {
                            $statusTinyLabel = $isPaidInTiny ? 'PAGO' : 'ABERTO';
                            $this->line("-> Status em harmonia (Local: " . strtoupper($invoice->status) . " | Tiny: {$statusTinyLabel}). Nenhuma ação.");
                        }
                    } 
                    // 2c. Erro temporário da API do Tiny
                    else {
                        $this->error("-> Erro ao ler resposta do Tiny para ID {$invoice->tiny_account_id}. Pulando.");
                        $errorCount++;
                        continue;
                    }
                }
                $successCount++;
            } catch (\Exception $e) {
                $this->error("-> Falha no processamento: " . $e->getMessage());
                $errorCount++;
            }

            // Evitar erro 429 de Rate Limit no Tiny ERP
            sleep(1);
        }

        $this->line("================================================================================");
        $this->info("=== RECONCILIAÇÃO FINALIZADA COM SUCESSO ===");
        $this->info("Processadas com sucesso: {$successCount}");
        $this->info("Faturas recriadas/corrigidas no Tiny: {$recreatedCount}");
        $this->info("Status de pagamento sincronizados: {$statusSyncedCount}");
        $this->info("Ignoradas/Sem cobrança: {$skipCount}");
        $this->error("Falhas/Erros: {$errorCount}");
        $this->line("================================================================================");

        return 0;
    }
}
