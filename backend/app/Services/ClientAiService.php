<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClientAiService
{
    protected $openaiKey;

    public function __construct()
    {
        $this->openaiKey = config('services.openai.key');
    }

    /**
     * Gera uma descrição "Sobre" de 1 parágrafo baseada no nome e cidade.
     * Tenta buscar informações no Google (via Places ou Search se disponível).
     */
    public function generateDescription(string $name, string $city): string
    {
        if (!$this->openaiKey) {
            Log::warning('[ClientAiService] OpenAI Key não configurada.');
            return '';
        }

        // 1. Coleta contexto adicional via Google Places (melhor fonte de 'resumo' disponível sem Search API)
        $placesService = app(GooglePlacesService::class);
        $details = $placesService->getDetailsByQuery("{$name} {$city}");
        
        $context = "";
        if ($details) {
            $context = "Nome no Google: {$details['name']}. Endereço: {$details['formatted_address']}. ";
            if (isset($details['website'])) $context .= "Website: {$details['website']}. ";
        }

        $prompt = "Escreva um texto 'Sobre' (descrição) de exatamente 1 parágrafo para a empresa '{$name}' em '{$city}'.\n" .
                  "Contexto extra encontrado: {$context}\n\n" .
                  "Instruções:\n" .
                  "- Use um tom profissional e convidativo.\n" .
                  "- Foque nos pontos fortes locais.\n" .
                  "- Não invente prêmios ou dados que não existam.\n" .
                  "- Máximo de 500 caracteres.";

        try {
            $response = Http::withToken($this->openaiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'system', 'content' => 'Você é um redator especializado em marketing para empresas locais luso-brasileiras.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.6
                ]);

            if (!$response->successful()) {
                Log::error('[ClientAiService] OpenAI Falhou', ['status' => $response->status(), 'body' => $response->body()]);
                return '';
            }

            return trim($response->json('choices.0.message.content'));

        } catch (\Throwable $e) {
            Log::error('[ClientAiService] Erro na geração da descrição', ['error' => $e->getMessage()]);
            return '';
        }
    }
}
