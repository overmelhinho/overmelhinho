<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Quote;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendDailyQuotesReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-daily-quotes-report';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envia um relatório diário de orçamentos solicitados no dia anterior para angelica@overmelhinho.com.br';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("📊 Gerando relatório de orçamentos diários...");

        $dataOntem = Carbon::yesterday();
        $startDate = $dataOntem->copy()->startOfDay();
        $endDate = $dataOntem->copy()->endOfDay();

        $dataReferencia = $dataOntem->format('d/m/Y');

        // Buscar todos os orçamentos de ontem com a relação cliente carregada
        $quotes = Quote::with('cliente')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'asc')
            ->get();

        $totalQuotes = $quotes->count();

        // WhatsApp: customer_whatsapp não contém @
        $whatsappQuotes = $quotes->filter(function ($quote) {
            return !str_contains($quote->customer_whatsapp, '@');
        })->count();

        // E-mail: customer_whatsapp contém @
        $emailQuotes = $quotes->filter(function ($quote) {
            return str_contains($quote->customer_whatsapp, '@');
        })->count();

        $this->line("Total: {$totalQuotes} (WhatsApp: {$whatsappQuotes}, E-mail: {$emailQuotes})");

        // Construir as linhas da tabela em HTML
        $tableRows = "";
        if ($totalQuotes > 0) {
            foreach ($quotes as $quote) {
                $lojista = $quote->cliente->nome_fantasia ?? 'Desconhecido';
                
                $isEmail = str_contains($quote->customer_whatsapp, '@');
                $contactBadge = $isEmail 
                    ? "<span style='padding: 2px 6px; background-color: #eff6ff; color: #1e40af; border-radius: 6px; font-size: 9px; font-weight: 850; text-transform: uppercase;'>📧 E-mail</span>"
                    : "<span style='padding: 2px 6px; background-color: #f0fdf4; color: #166534; border-radius: 6px; font-size: 9px; font-weight: 850; text-transform: uppercase;'>📱 WhatsApp</span>";

                $urgencyInfo = [
                    'emergencia' => "<span style='color: #dc2626; font-weight: 700;'>🚨 Emergência</span>",
                    'semana' => "<span style='color: #ea580c; font-weight: 700;'>⏳ Esta Semana</span>",
                ];
                $urgencyLabel = $urgencyInfo[$quote->urgency] ?? "<span style='color: #2563eb; font-weight: 700;'>🔍 Pesquisa</span>";

                $createdTime = Carbon::parse($quote->created_at)->format('H:i');

                $tableRows .= "
                    <tr style='border-bottom: 1px solid #f1f5f9;'>
                        <td style='padding: 16px 10px; font-size: 13px; font-weight: 600; color: #0f172a;'>
                            <div style='font-size: 13px; font-weight: 700; color: #0f172a;'>{$lojista}</div>
                            <div style='font-size: 11px; color: #64748b; font-weight: 500;'>{$quote->customer_name} às {$createdTime}</div>
                        </td>
                        <td style='padding: 16px 10px; font-size: 13px;'>
                            <div style='margin-bottom: 4px;'>{$contactBadge}</div>
                            <div style='font-size: 12px; font-weight: 600; color: #334155;'>{$quote->customer_whatsapp}</div>
                        </td>
                        <td style='padding: 16px 10px; font-size: 12px;'>
                            {$urgencyLabel}
                        </td>
                        <td style='padding: 16px 10px; font-size: 12px; color: #475569; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' title='" . htmlspecialchars($quote->service_requested, ENT_QUOTES) . "'>
                            " . htmlspecialchars($quote->service_requested) . "
                        </td>
                    </tr>
                ";
            }
        } else {
            $tableRows = "
                <tr style='border-bottom: 1px solid #f1f5f9;'>
                    <td colspan='4' align='center' style='padding: 40px 10px; color: #94a3b8; font-size: 14px; font-style: italic;'>
                        Nenhum orçamento solicitado no dia de ontem.
                    </td>
                </tr>
            ";
        }

        // HTML final do e-mail
        $htmlContent = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Relatório Diário de Orçamentos — O Vermelhinho</title>
        </head>
        <body style=\"margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; color: #333333;\">
            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #f6f9fc; padding: 40px 20px;'>
                <tr>
                    <td align='center'>
                        <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 750px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #eef2f6;'>
                            <!-- Header -->
                            <tr>
                                <td style='background: linear-gradient(135deg, #C00000 0%, #800000 100%); padding: 40px; text-align: center; color: #ffffff;'>
                                    <span style='font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px;'>Painel Administrativo</span>
                                    <h1 style='margin: 15px 0 5px 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;'>Orçamentos IA</h1>
                                    <p style='margin: 0; font-size: 14px; opacity: 0.8; font-weight: 500;'>Relatório Diário de Solicitações — {$dataReferencia}</p>
                                </td>
                            </tr>
                            <!-- Content -->
                            <tr>
                                <td style='padding: 40px;'>
                                    <!-- KPIs -->
                                    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='margin-bottom: 40px;'>
                                        <tr>
                                            <td width='30%' style='background-color: #f8fafc; border-radius: 16px; padding: 20px; text-align: center; border: 1px solid #f1f5f9;'>
                                                <div style='font-size: 10px; font-weight: 850; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 5px;'>Total Recebido</div>
                                                <div style='font-size: 32px; font-weight: 900; color: #0f172a;'>{$totalQuotes}</div>
                                            </td>
                                            <td width='5%'></td>
                                            <td width='30%' style='background-color: #f0fdf4; border-radius: 16px; padding: 20px; text-align: center; border: 1px solid #dcfce7;'>
                                                <div style='font-size: 10px; font-weight: 850; text-transform: uppercase; color: #15803d; letter-spacing: 1px; margin-bottom: 5px;'>Via WhatsApp</div>
                                                <div style='font-size: 32px; font-weight: 900; color: #166534;'>{$whatsappQuotes}</div>
                                            </td>
                                            <td width='5%'></td>
                                            <td width='30%' style='background-color: #eff6ff; border-radius: 16px; padding: 20px; text-align: center; border: 1px solid #dbeafe;'>
                                                <div style='font-size: 10px; font-weight: 850; text-transform: uppercase; color: #1d4ed8; letter-spacing: 1px; margin-bottom: 5px;'>Via E-mail</div>
                                                <div style='font-size: 32px; font-weight: 900; color: #1e40af;'>{$emailQuotes}</div>
                                            </td>
                                        </tr>
                                    </table>

                                    <h3 style='font-size: 14px; font-weight: 850; text-transform: uppercase; color: #0f172a; margin: 0 0 15px 0; letter-spacing: 1px;'>Lista de Solicitações</h3>
                                    
                                    <!-- Quotes Table -->
                                    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse: collapse;'>
                                        <thead>
                                            <tr style='border-bottom: 2px solid #f1f5f9;'>
                                                <th align='left' style='padding: 12px 10px; font-size: 10px; font-weight: 850; text-transform: uppercase; color: #64748b; letter-spacing: 1px;'>Loja / Solicitante</th>
                                                <th align='left' style='padding: 12px 10px; font-size: 10px; font-weight: 850; text-transform: uppercase; color: #64748b; letter-spacing: 1px;'>Contato</th>
                                                <th align='left' style='padding: 12px 10px; font-size: 10px; font-weight: 850; text-transform: uppercase; color: #64748b; letter-spacing: 1px;'>Urgência</th>
                                                <th align='left' style='padding: 12px 10px; font-size: 10px; font-weight: 850; text-transform: uppercase; color: #64748b; letter-spacing: 1px;'>Pedido</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {$tableRows}
                                        </tbody>
                                    </table>
                                    
                                    <div style='margin-top: 40px; padding-top: 25px; border-top: 1px solid #f1f5f9; text-align: center;'>
                                        <a href='https://dash.overmelhinho.com.br/dashboard/quotes' style='background-color: #C00000; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 800; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; display: inline-block; box-shadow: 0 6px 20px rgba(192, 0, 0, 0.15);'>Acessar Painel de Controle</a>
                                    </div>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style='background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 11px;'>
                                    <p style='margin: 0 0 5px 0; font-weight: 700; color: #475569;'>O Vermelhinho © 2026</p>
                                    <p style='margin: 0;'>Este relatório é gerado automaticamente pelo sistema de Orçamentos IA diariamente às 08h.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        ";

        $recipient = 'angelica.overmelhinho@gmail.com';
        $subject = "📊 Relatório Diário de Orçamentos IA — {$dataReferencia}";

        try {
            Mail::send([], [], function ($message) use ($recipient, $subject, $htmlContent) {
                $message->to($recipient)
                    ->from('overmelhinho.seo@gmail.com', 'Relatórios - O Vermelhinho')
                    ->subject($subject)
                    ->html($htmlContent);
            });

            $this->info("✅ Relatório de orçamentos enviado com sucesso para {$recipient}!");
            return Command::SUCCESS;
        } catch (\Exception $e) {
            Log::error("Erro ao enviar o relatório diário de orçamentos: " . $e->getMessage());
            $this->error("❌ Falha ao enviar o relatório por e-mail: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
