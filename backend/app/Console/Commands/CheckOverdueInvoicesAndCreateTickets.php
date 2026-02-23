<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\Ticket;
use App\Models\TicketLog;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckOverdueInvoicesAndCreateTickets extends Command
{
    protected $signature = 'app:check-overdue-invoices-tickets';
    protected $description = 'Cria tickets de cobrança para faturas vencidas há 3 dias';

    public function handle()
    {
        $targetDate = Carbon::now()->subDays(3)->startOfDay();

        $overdueInvoices = Invoice::where('status', 'pending')
            ->whereDate('due_date', $targetDate)
            ->get();

        $this->info("Encontradas " . $overdueInvoices->count() . " faturas vencidas há 3 dias.");

        foreach ($overdueInvoices as $invoice) {
            // Verifica se já existe um ticket de cobrança para esta fatura (armazenado no meta do ticket)
            $existingTicket = Ticket::where('meta->invoice_id', $invoice->id)
                ->where('setor', 'financeiro')
                ->first();

            if ($existingTicket) {
                $this->line("Ticket já existe para a fatura #{$invoice->id}. Pulando.");
                continue;
            }

            // Criar o Ticket
            $ticket = Ticket::create([
                'cliente_id' => $invoice->client_id,
                'created_by' => null, // Sistema
                'setor' => 'financeiro',
                'status' => 'aberto',
                'prioridade' => 'alta',
                'titulo' => "Cobrança de Fatura Vencida: Parcela {$invoice->parcel_number}/{$invoice->total_parcels}",
                'descricao' => "O sistema detectou que a fatura #{$invoice->id}, no valor de R$ " . number_format($invoice->amount, 2, ',', '.') . ", venceu em " . $invoice->due_date->format('d/m/Y') . " (há 3 dias) e continua pendente. Por favor, entre em contato com o cliente para regularização.",
                'due_at' => Carbon::now()->addDays(2), // Prazo de 2 dias para o financeiro resolver
                'meta' => [
                    'invoice_id' => $invoice->id,
                    'type' => 'overdue_invoice_automation'
                ]
            ]);

            TicketLog::create([
                'ticket_id' => $ticket->id,
                'action' => 'created',
                'message' => 'Ticket gerado automaticamente pelo sistema após 3 dias de atraso na fatura.'
            ]);

            $financeiroUsers = \App\Models\User::role(['Administrador', 'Diretor', 'Financeiro'])->get();
            if ($financeiroUsers->isNotEmpty()) {
                \Illuminate\Support\Facades\Notification::send(
                    $financeiroUsers,
                    new \App\Notifications\TicketAssignedNotification($ticket, 'Nova Cobrança a Fazer', 'created')
                );
            }

            $this->info("Ticket #{$ticket->id} criado para fatura #{$invoice->id}.");
        }

        return Command::SUCCESS;
    }
}
