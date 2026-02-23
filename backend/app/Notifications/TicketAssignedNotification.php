<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Channels\WebhookChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\SlackMessage;
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
        $channels = ['database', 'broadcast'];

        // Envia e-mail se o usuário tiver e-mail e o mailer não for 'log'/'null'
        if ($notifiable->email && config('mail.default') !== 'null') {
            $channels[] = 'mail';
        }

        // Envia Slack se houver webhook/token configurado
        if (config('services.slack.notifications.bot_user_oauth_token') || config('services.slack.notifications.channel')) {
            $channels[] = 'slack';
        }

        // Envia Webhook (WhatsApp/External) se houver URL configurada
        if (config('services.webhook.url')) {
            $channels[] = WebhookChannel::class;
        }

        return $channels;
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

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = url("/tickets/{$this->ticket->id}");

        return (new MailMessage)
            ->subject("O Vermelhinho - {$this->messageTitle}")
            ->greeting("Olá, {$notifiable->name}!")
            ->line("Um ticket foi {$this->actionType} para você ou seu setor.")
            ->line("**Título:** {$this->ticket->titulo}")
            ->line("**Setor:** " . ucfirst($this->ticket->setor))
            ->line("**Prioridade:** " . ucfirst($this->ticket->prioridade))
            ->action('Ver Ticket', $url)
            ->line('Obrigado por utilizar nosso sistema!');
    }

    /**
     * Get the Slack representation of the notification.
     */
    public function toSlack(object $notifiable): SlackMessage
    {
        $url = url("/tickets/{$this->ticket->id}");

        return (new SlackMessage)
            ->from('O Vermelhinho CRM', ':red_circle:')
            ->to(config('services.slack.notifications.channel'))
            ->content("🔔 *{$this->messageTitle}*\nO ticket #{$this->ticket->id} foi {$this->actionType}.\n*Título:* {$this->ticket->titulo}\n<{$url}|Clique aqui para visualizar>");
    }

    /**
     * Get the webhook representation of the notification.
     */
    public function toWebhook(object $notifiable): array
    {
        return [
            'event' => 'ticket_notification',
            'ticket_id' => $this->ticket->id,
            'title' => $this->messageTitle,
            'action' => $this->actionType,
            'ticket_title' => $this->ticket->titulo,
            'customer_name' => $this->ticket->cliente->nome_fantasia ?? 'N/A',
            'user' => [
                'name' => $notifiable->name,
                'email' => $notifiable->email,
                'phone' => $notifiable->telefone ?? null, // Supondo que exista telefone no User
            ]
        ];
    }
}
