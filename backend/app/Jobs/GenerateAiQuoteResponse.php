<?php

namespace App\Jobs;

use App\Models\Quote;
use App\Services\AiQuoteService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateAiQuoteResponse implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $quote;

    /**
     * Create a new job instance.
     */
    public function __construct(Quote $quote)
    {
        $this->quote = $quote;
    }

    /**
     * Execute the job.
     */
    public function handle(AiQuoteService $aiService, \App\Services\ZApiService $zapiService): void
    {
        $draft = $aiService->generateDraftResponse($this->quote);

        if ($draft) {
            $this->quote->update([
                'ai_draft_response' => $draft
            ]);

            // Enviar notificação via WhatsApp para o lojista
            $this->notifyLojista($zapiService);
        }
    }

    protected function notifyLojista(\App\Services\ZApiService $zapiService): void
    {
        $this->quote->load('cliente.contatos');
        $cliente = $this->quote->cliente;

        if (!$cliente) return;

        $contato = $cliente->contatos->whereNotNull('celular')->first();
        if (!$contato) return;

        $phone = preg_replace('/\D+/', '', (string)$contato->celular);
        
        // Adicionar DDI 55 se não tiver
        if (strlen($phone) === 11 || strlen($phone) === 10) {
            $phone = '55' . $phone;
        }

        $message = "🔴 *Novo Orçamento Urgente — O Vermelhinho*\n\n" .
                   "Olá, *{$cliente->nome_fantasia}*!\n\n" .
                   "O cliente *{$this->quote->customer_name}* solicitou um orçamento pelo seu site:\n\n" .
                   "📋 *Pedido:* {$this->quote->service_requested}\n" .
                   "⏱ *Urgência:* " . ucfirst($this->quote->urgency) . "\n" .
                   "📱 *WhatsApp:* {$this->quote->customer_whatsapp}\n\n" .
                   "🤖 *Rascunho IA sugerido:*\n" .
                   "\"" . substr($this->quote->ai_draft_response, 0, 300) . "...\"\n\n" .
                   "👉 Acesse sua Fila de Foco para responder:\n" .
                   "https://dash.overmelhinho.com.br/dashboard/foco";

        if ($zapiService->sendText($phone, $message)) {
            $this->quote->update([
                'notified_at' => now()
            ]);
        }
    }
}
