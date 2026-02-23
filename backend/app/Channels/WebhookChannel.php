<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookChannel
{
    /**
     * Send the given notification.
     */
    public function send($notifiable, Notification $notification)
    {
        if (!method_exists($notification, 'toWebhook')) {
            return;
        }

        $data = $notification->toWebhook($notifiable);
        $url = config('services.webhook.url');

        if (!$url) {
            return;
        }

        try {
            Http::post($url, $data);
        }
        catch (\Exception $e) {
            Log::error("Webhook notification failed", [
                'error' => $e->getMessage(),
                'url' => $url,
                'data' => $data
            ]);
        }
    }
}
