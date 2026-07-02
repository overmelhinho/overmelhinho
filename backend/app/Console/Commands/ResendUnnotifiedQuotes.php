<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Quote;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ResendUnnotifiedQuotes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quotes:resend-unnotified';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reenvia e-mails para orçamentos que ficaram sem notificação devido à regra antiga';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $quotes = Quote::with('cliente.contatos')
            ->whereNull('notified_at')
            ->where('status', 'new')
            ->get();

        if ($quotes->isEmpty()) {
            $this->info('Nenhum orçamento pendente de notificação encontrado.');
            return;
        }

        $this->info("Encontrados {$quotes->count()} orçamentos não notificados. Iniciando envios...");

        $countSent = 0;

        foreach ($quotes as $quote) {
            $cliente = $quote->cliente;
            
            if (!$cliente) continue;

            $contatoEmail = $cliente->contatos->whereNotNull('email_principal')->first();

            if ($contatoEmail) {
                $email = $contatoEmail->email_principal;
                $contactLabel = str_contains($quote->customer_whatsapp, '@') ? 'E-mail' : 'WhatsApp';
                $urgencyLabel = ucfirst($quote->urgency);
                $subject = "🔴 Novo Orçamento Urgente — O Vermelhinho";

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
                        <div style='text-align: center; margin-top: 25px;'>
                            <a href='https://dash.overmelhinho.com.br/dashboard/foco' style='background-color: #C00000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;'>👉 Acesse sua Fila de Foco para responder</a>
                        </div>
                    </div>
                ";

                try {
                    Mail::send([], [], function ($message) use ($email, $subject, $htmlContent) {
                        $message->to($email)
                            ->subject($subject)
                            ->html($htmlContent);
                    });

                    $quote->update(['notified_at' => now()]);
                    $this->line("E-mail enviado para: {$cliente->nome_fantasia} ({$email})");
                    $countSent++;
                } catch (\Exception $e) {
                    Log::error("Erro ao enviar e-mail de notificação (Comando) para {$cliente->nome_fantasia}: " . $e->getMessage());
                    $this->error("Erro ao enviar para {$cliente->nome_fantasia}.");
                }
            } else {
                $this->line("Cliente {$cliente->nome_fantasia} não possui e-mail válido. Pulando.");
            }
        }

        $this->info("Concluído! {$countSent} e-mails enviados com sucesso.");
    }
}
