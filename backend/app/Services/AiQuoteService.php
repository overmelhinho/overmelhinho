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

    /**
     * Gera uma mensagem de prospecção via WhatsApp para clientes gratuitos.
     */
    public function generateProspectingMessage(Quote $quote)
    {
        $cliente = $quote->cliente;
        $cliente->loadMissing('contatos');
        
        $contatoEmail = $cliente->contatos->whereNotNull('email_principal')->first();
        $emailEmpresa = $contatoEmail ? $contatoEmail->email_principal : 'cadastrado no sistema';
        
        $nomeEmpresa = trim($cliente->nome_fantasia ?: 'Parceiro');
        $mensagemServico = trim($quote->service_requested);

        $template = "Olá, equipe da {$nomeEmpresa} ! 😊\n\n"
                  . "Espero que estejam bem. Sou do comercial aqui do O Vermelhinho.\n\n"
                  . "Acabamos de captar um pedido de orçamento para vocês: um cliente está buscando um '{$mensagemServico}'. Enviamos todos os detalhes e dados do cliente para o e-mail {$emailEmpresa} cadastrado em nosso sistema.\n\n"
                  . "Porém, gostaria de compartilhar uma oportunidade com vocês. Se optarem por anunciar na nossa plataforma através de um de nossos planos pagos, receberiam esses contatos diretamente no WhatsApp, em tempo real, além de contar com uma visibilidade muito maior para a {$nomeEmpresa}.\n\n"
                  . "Que tal conhecer melhor nossos planos e verificar como podemos ajudar ainda mais no crescimento das suas vendas? Aguardo seu retorno.\n\n"
                  . "Um grande abraço!🙂";

        return $template;
    }
}
