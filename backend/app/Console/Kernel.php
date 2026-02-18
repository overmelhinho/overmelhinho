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
    ];

    /**
     * Definir a programação de comandos.
     */
    protected function schedule(Schedule $schedule)
    {
        // 🕓 Executa todos os dias às 03:00 da manhã
        $schedule->command('supabase:clean-temp')->dailyAt('03:00');
    }

    /**
     * Registrar os comandos do aplicativo.
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
