<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Ticket;
use App\Models\TicketLog;
use App\Models\User;
use App\Notifications\TicketAssignedNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class TicketService
{
    /**
     * Cria um ticket de onboarding para um novo cliente.
     */
    public function createOnboardingTicket(Cliente $cliente): Ticket
    {
        $ticket = Ticket::create([
            'cliente_id' => $cliente->id,
            'created_by' => null, // Sistema
            'setor' => 'suporte',
            'status' => 'aberto',
            'prioridade' => 'normal',
            'titulo' => "Onboarding: {$cliente->nome_fantasia}",
            'descricao' => "Novo cliente cadastrado no sistema. Por favor, verifique os dados cadastrais (Logo, Galeria, Contatos) e entre em contato para as boas-vindas.",
            'due_at' => now()->addDays(1), // Prazo de 1 dia para o suporte
            'meta' => [
                'type' => 'onboarding_automation'
            ]
        ]);

        $this->logAction($ticket->id, null, 'created', 'Ticket de onboarding gerado automaticamente pelo sistema.');

        $this->notifySetor($ticket, 'suporte', 'Novo Ticket de Onboarding');

        return $ticket;
    }

    /**
     * Notifica usuários elegíveis de um setor sobre um ticket.
     */
    public function notifySetor(Ticket $ticket, string $setor, string $title): void
    {
        $users = $this->eligibleUsersForSetor($setor);

        if ($users->isEmpty()) {
            // Se ninguém no setor, notifica Admins/Diretores como fallback
            $users = User::role(['Administrador', 'Diretor'])->get();
        }

        if ($users->isNotEmpty()) {
            Notification::send($users, new TicketAssignedNotification($ticket, $title, 'created'));
        }
    }

    /**
     * Retorna usuários elegíveis para um setor.
     */
    public function eligibleUsersForSetor(string $setor)
    {
        $map = [
            'criativo' => ['Criativo'],
            'admin' => ['Administrador', 'Diretor'],
            'financeiro' => ['Financeiro', 'Administrador', 'Diretor'],
            'suporte' => ['Suporte', 'Administrador', 'Diretor'],
        ];

        $roles = $map[$setor] ?? ['Administrador', 'Diretor'];

        try {
            return User::role($roles)->get(['id', 'name', 'email']);
        }
        catch (\Throwable $e) {
            Log::warning("Erro ao buscar usuários para o setor {$setor}: " . $e->getMessage());
            return collect();
        }
    }

    /**
     * Registra logs do ticket.
     */
    public function logAction(int $ticketId, ?int $userId, string $action, ?string $message = null): void
    {
        try {
            TicketLog::create([
                'ticket_id' => $ticketId,
                'user_id' => $userId,
                'action' => $action,
                'message' => $message,
            ]);
        }
        catch (\Throwable $e) {
            Log::warning('TicketLog create failed', [
                'ticket_id' => $ticketId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
