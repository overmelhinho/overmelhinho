<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class TicketAssignedNotification extends Notification implements ShouldBroadcastNow
{
    use Queueable;

    public Ticket $ticket;
    public string $messageTitle;
    public string $actionType;

    /**
     * Create a new notification instance.
     */
    public function __construct(Ticket $ticket, string $messageTitle, string $actionType = 'assigned')
    {
        $this->ticket = $ticket;
        $this->messageTitle = $messageTitle;
        $this->actionType = $actionType;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Envia para o banco de dados (o 'sininho') e broadcast (o popup real-time)
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification para salvar no DB.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'title' => $this->messageTitle,
            'action' => $this->actionType,
            'ticket_title' => $this->ticket->titulo,
        ];
    }

    /**
     * Broadcast the notification em tempo real.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'ticket_id' => $this->ticket->id,
            'title' => $this->messageTitle,
            'action' => $this->actionType,
            'ticket_title' => $this->ticket->titulo,
        ]);
    }
}
