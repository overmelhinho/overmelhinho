<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ZApiService
{
    protected string $instanceId;
    protected string $token;
    protected string $clientId;
    protected string $baseUrl;

    public function __construct()
    {
        $this->instanceId = config('services.zapi.instance_id') ?? '';
        $this->token = config('services.zapi.token') ?? '';
        $this->clientId = config('services.zapi.client_id') ?? '';
        $this->baseUrl = "https://api.z-api.io/instances/{$this->instanceId}/token/{$this->token}";
    }

    /**
     * Envia uma mensagem de texto simples via WhatsApp.
     * 
     * @param string $phone Número formatado com DDI e DDD (ex: 5551988887777)
     * @param string $message Conteúdo da mensagem
     * @return bool
     */
    public function sendText(string $phone, string $message): bool
    {
        if (empty($this->instanceId) || empty($this->token)) {
            Log::error("Z-API: Instance ID ou Token não configurados.");
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Client-Token' => $this->clientId
            ])->post("{$this->baseUrl}/send-text", [
                'phone' => $phone,
                'message' => $message
            ]);

            if ($response->successful()) {
                Log::info("Z-API: Mensagem enviada para {$phone}. ID: " . ($response->json()['messageId'] ?? 'unknown'));
                return true;
            }

            Log::error("Z-API Erro ao enviar para {$phone}: " . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::error("Z-API Exception: " . $e->getMessage());
            return false;
        }
    }
}
