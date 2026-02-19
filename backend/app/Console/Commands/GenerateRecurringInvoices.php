<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateRecurringInvoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'financial:generate-recurring';

    protected $description = 'Gera faturas recorrentes para clientes ativos no dia de vencimento';

    public function handle(\App\Services\TinyErpService $tinyService)
    {
        $today = now();
        $dayOfMonth = $today->day;

        $this->info("Iniciando geração de faturas recorrentes para o dia {$dayOfMonth}...");

        // Busca clientes ativos, pagantes, com plano definido e dia de recorrência igual a hoje
        $clients = \App\Models\Cliente::where('tipo_cliente', 'pagante') // ou status_assinatura = 'ativo'
            ->whereNotNull('plan_id')
            ->where('recurrence_day', $dayOfMonth)
            ->get();

        $count = 0;

        foreach ($clients as $client) {
            // Verifica se já gerou fatura este mês para evitar duplicidade
            if ($client->last_invoice_generated_at &&
            \Carbon\Carbon::parse($client->last_invoice_generated_at)->isSameMonth($today)) {
                $this->warn("Cliente {$client->nome_fantasia} (ID: {$client->id}) já possui fatura gerada este mês. Pulando.");
                continue;
            }

            try {
                $plan = $client->plan;
                if (!$plan) {
                    $this->error("Cliente {$client->id} tem plan_id mas plano não encontrado.");
                    continue;
                }

                $this->info("Gerando fatura para: {$client->nome_fantasia}");

                // Cria fatura local
                $invoice = \App\Models\Invoice::create([
                    'client_id' => $client->id,
                    'plan_id' => $plan->id,
                    'amount' => $plan->price,
                    'due_date' => $today->copy()->addDays(5), // Vencimento em 5 dias (configurável)
                    'status' => 'pending',
                ]);

                // Envia para o Tiny
                $tinyData = $tinyService->createReceivable($invoice);

                // Atualiza fatura com dados do Tiny
                $invoice->update([
                    'tiny_account_id' => $tinyData['tiny_account_id'],
                    'payment_url' => $tinyData['payment_url'],
                ]);

                // Atualiza data da última geração no cliente
                $client->update(['last_invoice_generated_at' => $today]);

                $this->info("Fatura gerada com sucesso! Tiny ID: {$tinyData['tiny_account_id']}");
                $count++;

            }
            catch (\Exception $e) {
                $this->error("Erro ao gerar fatura para {$client->nome_fantasia}: " . $e->getMessage());
                \Illuminate\Support\Facades\Log::error("Erro no comando financial:generate-recurring: " . $e->getMessage());
            }
        }

        $this->info("Processo finalizado. {$count} faturas geradas.");
    }
}
