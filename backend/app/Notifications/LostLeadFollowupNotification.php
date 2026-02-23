<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Channels\WebhookChannel;

class LostLeadFollowupNotification extends Notification
{
    use Queueable;

    private $lead;

    /**
     * Create a new notification instance.
     */
    public function __construct($lead)
    {
        $this->lead = $lead;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return [WebhookChannel::class];
    }

    /**
     * Get the webhook representation of the notification.
     */
    public function toWebhook(object $notifiable): array
    {
        return [
            'type' => 'whatsapp',
            'phone' => $this->lead->telefone,
            'message' => "Olá {$this->lead->nome}, tudo bem? Aqui é do O Vermelhinho. Estivemos pensando em você e queríamos saber se mudou de ideia sobre a nossa proposta. Como podemos te ajudar hoje?"
        ];
    }
}
