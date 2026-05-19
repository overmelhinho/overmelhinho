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
