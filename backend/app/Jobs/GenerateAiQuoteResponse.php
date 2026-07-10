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
        // Enviar notificação via e-mail (e WhatsApp se aplicável) para o lojista
        $this->notifyLojista($zapiService);
    }

    protected function notifyLojista(\App\Services\ZApiService $zapiService): void
    {
        $this->quote->load('cliente.contatos');
        $cliente = $this->quote->cliente;

        if (!$cliente) return;

        $isPagante = in_array($cliente->tipo_cliente, ['pagante', 'anunciante']) && in_array($cliente->status_assinatura, ['ativa', 'ativo', 'inadimplente']);

        // A regra do WhatsApp (Fila de Foco) só se aplica se for pagante e tiver celular.
        // Mas independentemente disso, se tiver e-mail, envia o e-mail automático em segundo plano.
        $contatoEmail = $cliente->contatos->whereNotNull('email_principal')->first();

        if ($contatoEmail) {
            $email = $contatoEmail->email_principal;
            
            $contactLabel = str_contains($this->quote->customer_whatsapp, '@') ? 'E-mail' : 'WhatsApp';
            $urgencyLabel = ucfirst($this->quote->urgency);

            $subject = "🔴 Novo Orçamento Urgente — O Vermelhinho";

            $htmlContent = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                    <h2 style='color: #C00000; margin-top: 0;'>🔴 Novo Orçamento Urgente — O Vermelhinho</h2>
                    <p>Olá, <strong>{$cliente->nome_fantasia}</strong>!</p>
                    <p>O cliente <strong>{$this->quote->customer_name}</strong> solicitou um orçamento pelo seu site:</p>
                    <div style='background-color: #f9f9f9; padding: 15px; border-left: 4px solid #C00000; margin: 15px 0;'>
                        <p style='margin: 5px 0;'><strong>📋 Pedido:</strong> {$this->quote->service_requested}</p>
                        <p style='margin: 5px 0;'><strong>⏳ Urgência:</strong> {$urgencyLabel}</p>
                        <p style='margin: 5px 0;'><strong>{$contactLabel}:</strong> {$this->quote->customer_whatsapp}</p>
                    </div>
                </div>
            ";

            try {
                \Illuminate\Support\Facades\Mail::html($htmlContent, function ($message) use ($email, $subject) {
                    $message->to($email)
                        ->subject($subject);
                });

                $this->quote->update([
                    'notified_at' => now()
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Erro ao enviar e-mail de notificação para o lojista {$cliente->nome_fantasia}: " . $e->getMessage());
            }
        }
    }
}
