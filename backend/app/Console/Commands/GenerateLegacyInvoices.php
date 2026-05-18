<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\AutorizacaoParcela;
use App\Models\Invoice;
use App\Models\Autorizacao;

class GenerateLegacyInvoices extends Command
{
    protected $signature = 'data:generate-invoices';
    protected $description = 'Gera Invoices (faturas) para as parcelas legadas que ainda não possuem.';

    public function handle()
    {
        $this->info("Verificando parcelas sem fatura vinculada...");
        
        $total = DB::table('autorizacao_parcelas')->whereNull('invoice_id')->count();
        $this->info("Total de faturas a gerar: {$total}");

        if ($total === 0) {
            return;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        // Fazemos o chunk diretamente pelas parcelas sem invoice_id
        AutorizacaoParcela::whereNull('invoice_id')->chunkById(1000, function ($parcelas) use ($bar) {
            
            // Pre-carregar autorizacoes para evitar queries N+1
            $autorizacaoIds = $parcelas->pluck('autorizacao_id')->unique();
            $autorizacoes = Autorizacao::whereIn('id', $autorizacaoIds)->get()->keyBy('id');

            $invoicesToInsert = [];
            
            foreach ($parcelas as $parcela) {
                $autorizacao = $autorizacoes[$parcela->autorizacao_id] ?? null;
                
                if (!$autorizacao) {
                    $bar->advance();
                    continue;
                }

                $invoicesToInsert[] = [
                    'client_id'      => $autorizacao->cliente_id,
                    'plan_id'        => $autorizacao->plan_id,
                    'amount'         => $parcela->valor,
                    'payable_amount' => $parcela->payable_amount,
                    'is_permuta'     => $autorizacao->is_permuta ? 'true' : 'false',
                    'permuta_amount' => $parcela->permuta_amount ?? 0,
                    'permuta_description' => $autorizacao->permuta_description,
                    'due_date'       => $parcela->vencimento,
                    'status'         => $parcela->status === 'pago' ? 'paid' : 'pending',
                    'payment_method' => $autorizacao->payment_method ?? 'pix',
                    'parcel_number'  => $parcela->numero,
                    'total_parcels'  => $autorizacao->num_parcelas ?? 1,
                    'group_id'       => 'autorizacao-' . $autorizacao->id,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];
            }

            if (!empty($invoicesToInsert)) {
                // Inserir em lote no banco
                DB::table('invoices')->insert($invoicesToInsert);

                // Como usamos insert(), não temos os IDs retornados facilmente para o update_batch.
                // Mas podemos fazer um UPDATE WHERE autorizacao_id ... AND numero = ...
                // Para não complicar a lógica de update e causar lentidão, 
                // após inserir, nós podemos buscar os recém criados e atualizar
            }

            $bar->advance($parcelas->count());
        });

        $bar->finish();
        
        $this->newLine();
        $this->info("Invoices inseridas. Agora vamos vincular o invoice_id nas parcelas (pode levar 1 minuto)...");

        // Faz um update em massa inteligente:
        // invoices tem group_id = 'autorizacao-XXX' e parcel_number = Y
        DB::statement("
            UPDATE autorizacao_parcelas ap
            SET invoice_id = i.id
            FROM invoices i
            WHERE i.group_id = 'autorizacao-' || ap.autorizacao_id
              AND i.parcel_number = ap.numero
              AND ap.invoice_id IS NULL
        ");

        $this->info("✅ Invoices geradas e vinculadas com sucesso!");
    }
}
