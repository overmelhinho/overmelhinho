<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Registrar comandos personalizados.
     */
    protected $commands = [
        \App\Console\Commands\CleanTempSupabase::class,
        \App\Console\Commands\GenerateRecurringInvoices::class,
        \App\Console\Commands\CheckOverdueInvoicesAndCreateTickets::class,
        \App\Console\Commands\GenerateRenewals::class,
        \App\Console\Commands\UpdateClientStatuses::class,
        \App\Console\Commands\SyncMissingInvoices::class,
        \App\Console\Commands\SyncTinyErpCommand::class,
        \App\Console\Commands\ReconcileTinyInvoicesCommand::class,
        \App\Console\Commands\SendDailyQuotesReport::class,
        \App\Console\Commands\PopulateIndexingQueue::class,
        \App\Console\Commands\ProcessIndexingQueue::class,
        \App\Console\Commands\PruneSeoRankings::class,
    ];

    /**
     * Definir a programação de comandos.
     */
    protected function schedule(Schedule $schedule)
    {
        // 🕓 Executa todos os dias às 03:00 da manhã
        $schedule->command('supabase:clean-temp')->dailyAt('03:00');

        // 💰 Gera faturas recorrentes todos os dias às 06:00 da manhã
        $schedule->command('financial:generate-recurring')->dailyAt('06:00');

        // 🎫 Verifica faturas vencidas e cria tickets às 07:00 da manhã
        $schedule->command('app:check-overdue-invoices-tickets')->dailyAt('07:00');

        // 🔄 Gera renovações no dia 1 de cada mês às 05:00 (contratos que vencem no mês seguinte)
        $schedule->command('renewals:generate')->monthlyOn(1, '05:00');

        // 📅 Verifica a vigência de contratos e inativa clientes vencidos todos os dias às 00:30
        $schedule->command('app:update-client-statuses')->dailyAt('00:30');

        // 🛡️ Verifica se existem autorizações assinadas sem faturas geradas e sincroniza automaticamente às 04:00
        $schedule->command('invoices:sync-missing')->dailyAt('04:00');

        // 🤖 Sincroniza faturas pendentes com o Tiny ERP automaticamente a cada 10 minutos
        $schedule->command('tiny:sync-status')->everyTenMinutes();

        // 📊 Envia o relatório diário de orçamentos às 08:00 da manhã
        $schedule->command('app:send-daily-quotes-report')->dailyAt('08:00');

        // 🔍 Varre o banco e carrega URLs ativas para fila de indexação (Todo Domingo às 01:00)
        $schedule->command('seo:populate-indexing-queue')->weeklyOn(0, '01:00');

        // 📡 Envia URLs pendentes para a Google Indexing API diariamente às 02:00
        $schedule->command('seo:process-indexing-queue')->dailyAt('02:00');
        
        // 📈 Rastreamento de posições no Google Search Console (Fracionado, apenas ativos) diariamente
        $schedule->command('seo:check-rankings')->dailyAt('02:30');
        
        // 🧹 Limpeza de banco de dados do histórico do GSC (Todo Domingo às 04:00)
        $schedule->command('seo:prune-rankings')->weeklyOn(0, '04:00');
    }

    /**
     * Registrar os comandos do aplicativo.
     */
    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
