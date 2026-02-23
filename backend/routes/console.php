<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automação: Esteira de Follow-up de Leads Perdidos (A cada 3 meses)
// Roda todos os dias às 10 da manhã para verificar quais leads completam o ciclo naquele dia
use Illuminate\Support\Facades\Schedule;
Schedule::command('leads:process-lost-followup')->dailyAt('10:00');

// Checagem quinzenal do SEO (Google Search Console) - a cada 14 dias
Schedule::command('seo:check-rankings')->cron('0 2 */14 * *');
