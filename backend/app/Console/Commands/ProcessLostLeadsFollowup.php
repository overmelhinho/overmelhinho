<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ProcessLostLeadsFollowup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leads:process-lost-followup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Processa a esteira de leads perdidos. Envia e-mail para angelica@overmelhinho.com.br a cada 3 meses avisando sobre o lead.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Iniciando esteira de follow-up de leads perdidos...");

        // Buscar leads perdidos que não têm lost_at nulo
        $leads = \App\Models\Lead::where('status', 'perdido')
            ->whereNotNull('lost_at')
            ->get();

        $count = 0;

        foreach ($leads as $lead) {
            $lostAt = \Carbon\Carbon::parse($lead->lost_at);
            $now = \Carbon\Carbon::now();

            $shouldFollowUp = false;

            if ($lead->data_follow_up) {
                // Se foi definida uma data específica no painel, enviamos nela
                $followUpDate = \Carbon\Carbon::parse($lead->data_follow_up);
                if ($followUpDate->isSameDay($now)) {
                    $shouldFollowUp = true;
                }
            } else {
                // Regra padrão: a cada 3 meses (90 dias)
                $diffInMonths = $lostAt->diffInMonths($now);
                if ($diffInMonths > 0 && $diffInMonths % 3 === 0 && $lostAt->day === $now->day) {
                    $shouldFollowUp = true;
                }
            }

            if ($shouldFollowUp) {
                // É hora do aviso! Apenas envia e-mail para a Angélica
                try {
                    $htmlContent = "
                    <html>
                    <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
                        <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>
                            <div style='background-color: #C00000; padding: 20px; text-align: center; color: #ffffff;'>
                                <h1 style='margin: 0; font-size: 24px;'>Recuperação de Lead Perdido</h1>
                            </div>
                            <div style='padding: 30px;'>
                                <p style='font-size: 16px; color: #333333; line-height: 1.6;'>
                                    Olá Angélica, já faz {$diffInMonths} meses que perdemos o lead <strong>{$lead->nome}</strong>. É um bom momento para tentar contato novamente!
                                </p>
                                <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                                    <tr>
                                        <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Nome:</td>
                                        <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$lead->nome}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Telefone:</td>
                                        <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$lead->telefone}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Responsável Anterior:</td>
                                        <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$lead->responsavel}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Motivo da Perda:</td>
                                        <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$lead->motivo_perda}</td>
                                    </tr>
                                </table>
                                <div style='margin-top: 30px; text-align: center;'>
                                    <a href='https://dash.overmelhinho.com.br/leads-kanban' style='background-color: #C00000; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;'>Acessar Painel de Leads</a>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                    ";

                    \Illuminate\Support\Facades\Mail::html($htmlContent, function ($message) use ($lead) {
                        $message->to('angelica@overmelhinho.com.br')
                            ->from(config('mail.from.address', 'relatorios@overmelhinho.com.br'), 'App - O Vermelhinho')
                            ->subject("⚠️ Recuperação de Lead: {$lead->nome}");
                    });

                    $count++;
                    $this->info("E-mail enviado para Angélica sobre o lead: {$lead->nome}");
                } catch (\Exception $e) {
                    \Log::error('[LEAD_FOLLOWUP][EMAIL_ERROR] Erro ao notificar Angélica: ' . $e->getMessage());
                }
            }
        }

        $this->info("Esteira de follow-up finalizada. {$count} mensagens enviadas.");
    }
}
