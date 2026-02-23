<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ProcessLostLeadsFollowup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leads:process-lost-followup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Processa a esteira de leads perdidos. Envia WhatsApp a cada 3 meses para tentar reativá-los.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Iniciando esteira de follow-up de leads perdidos...");

        // Buscar leads perdidos que não têm lost_at nulo
        $leads = \App\Models\Lead::where('status', 'perdido')
            ->whereNotNull('lost_at')
            ->get();

        $count = 0;

        foreach ($leads as $lead) {
            $lostAt = \Carbon\Carbon::parse($lead->lost_at);
            $now = \Carbon\Carbon::now();

            // Verifica a diferença de meses e se o dia é hoje
            // Para não enviar várias vezes no mesmo mês, checamos se faz exatamente X meses e o mesmo dia
            $diffInMonths = $lostAt->diffInMonths($now);

            if ($diffInMonths > 0 && $diffInMonths % 3 === 0 && $lostAt->day === $now->day) {
                // É hora do follow up!
                $lead->notify(new \App\Notifications\LostLeadFollowupNotification($lead));
                
                // Criação de Ticket de Tarefa para o Responsável
                $assigneeId = null;
                if ($lead->responsavel) {
                    $assignee = \App\Models\User::where('name', 'like', "%{$lead->responsavel}%")->first();
                    $assigneeId = $assignee?->id;
                }

                // Se não achou responsável, coloca no setor comercial/vendas (ID 1 ou primeiro disponível)
                if (!$assigneeId) {
                    $assigneeId = \App\Models\User::first()?->id;
                }

                \App\Models\Ticket::create([
                    'lead_id' => $lead->id,
                    'titulo' => "Recuperação de Lead: {$lead->nome}",
                    'descricao' => "O sistema enviou um follow-up automático de 3 meses para este lead. Por favor, verifique se houve resposta ou tente um contato direto. Motivo original da perda: {$lead->motivo_perda}",
                    'assignee_id' => $assigneeId,
                    'setor' => 'comercial',
                    'status' => 'aberto',
                    'prioridade' => 'media',
                    'tipo' => 'tarefa',
                    'due_at' => now()->addDays(2), // 2 dias para conferir
                ]);

                $count++;
                $this->info("Follow-up enviado e Ticket criado para o lead: {$lead->nome}");
            }
        }

        $this->info("Esteira de follow-up finalizada. {$count} mensagens enviadas.");
    }
}
