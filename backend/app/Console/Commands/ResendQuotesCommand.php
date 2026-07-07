<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Quote;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ResendQuotesCommand extends Command
{
    protected $signature = 'app:resend-quotes';
    protected $description = 'Reenvia os e-mails de notificação de orçamentos pendentes que foram gerados mas não enviados via SMTP.';

    public function handle()
    {
        $this->info("Buscando orçamentos não respondidos (status = new)...");

        // Busca orçamentos novos que já têm rascunho de IA (logo, já passaram pela fila)
        $quotes = Quote::with('cliente.contatos')
            ->where('status', 'new')
            ->whereNotNull('ai_draft_response')
            ->orderBy('created_at', 'desc')
            ->get();

        $this->info("Encontrados {$quotes->count()} orçamentos.");

        $count = 0;

        foreach ($quotes as $quote) {
            $cliente = $quote->cliente;
            if (!$cliente) continue;

            $contatoEmail = $cliente->contatos->whereNotNull('email_principal')->first();

            if ($contatoEmail) {
                $email = $contatoEmail->email_principal;
                $contactLabel = str_contains($quote->customer_whatsapp, '@') ? 'E-mail' : 'WhatsApp';
                $urgencyLabel = ucfirst($quote->urgency);
                $subject = "🔴 Novo Orçamento Urgente — O Vermelhinho (Reenvio)";

                $htmlContent = "
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                        <h2 style='color: #C00000; margin-top: 0;'>🔴 Novo Orçamento Urgente — O Vermelhinho</h2>
                        <p>Olá, <strong>{$cliente->nome_fantasia}</strong>!</p>
                        <p>O cliente <strong>{$quote->customer_name}</strong> solicitou um orçamento pelo seu site:</p>
                        <div style='background-color: #f9f9f9; padding: 15px; border-left: 4px solid #C00000; margin: 15px 0;'>
                            <p style='margin: 5px 0;'><strong>📋 Pedido:</strong> {$quote->service_requested}</p>
                            <p style='margin: 5px 0;'><strong>⏱ Urgência:</strong> {$urgencyLabel}</p>
                            <p style='margin: 5px 0;'><strong>{$contactLabel}:</strong> {$quote->customer_whatsapp}</p>
                        </div>
                        <div style='margin: 20px 0;'>
                            <h4 style='margin-bottom: 5px; color: #333;'>🤖 Rascunho IA sugerido:</h4>
                            <p style='font-style: italic; color: #555; background-color: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap;'>
                                \"{$quote->ai_draft_response}\"
                            </p>
                        </div>
                    </div>
                ";

                try {
                    Mail::html($htmlContent, function ($message) use ($email, $subject) {
                        $message->to($email)->subject($subject);
                    });
                    
                    $this->line("✅ Enviado para {$cliente->nome_fantasia} ({$email})");
                    $count++;
                } catch (\Exception $e) {
                    $this->error("❌ Erro ao enviar para {$cliente->nome_fantasia}: " . $e->getMessage());
                }
            }
        }

        $this->info("Reenvio concluído! {$count} e-mails enviados.");
    }
}
