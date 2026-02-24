<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Quote;

class AiQuoteService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.openai.key') ?? env('OPENAI_API_KEY');
    }

    /**
     * Gera um rascunho de resposta via OpenAI para o orçamento.
     */
    public function generateDraftResponse(Quote $quote)
    {
        if (!$this->apiKey) {
            Log::error("AiQuoteService: OPENAI_API_KEY não configurada.");
            return null;
        }

        $cliente = $quote->cliente;
        $segmento = $cliente->segmentos()->first()?->nome ?? 'Comércio'; // Fallback se não tiver segmento
        
        $urgencyLabel = [
            'pesquisa' => 'Apenas pesquisando',
            'semana' => 'Para esta semana',
            'emergencia' => 'Emergência (imediato)'
        ][$quote->urgency] ?? $quote->urgency;

        $prompt = "Você é um assistente de vendas da empresa {$cliente->nome_fantasia}, do segmento {$segmento}. " .
                  "O cliente {$quote->customer_name} pediu um orçamento para: {$quote->service_requested}. " .
                  "A urgência dele é: {$urgencyLabel}. " .
                  "Escreva uma mensagem curta e amigável para o WhatsApp, confirmando que vocês podem ajudar e sugerindo o próximo passo. " .
                  "Se a urgência for 'emergência', use um tom de prontidão imediata.";

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4', // Ou 'gpt-3.5-turbo' para custo menor/velocidade
                'messages' => [
                    ['role' => 'system', 'content' => $prompt],
                ],
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                return trim($content);
            }

            Log::error("AiQuoteService API Error: " . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error("AiQuoteService Exception: " . $e->getMessage());
            return null;
        }
    }
}
