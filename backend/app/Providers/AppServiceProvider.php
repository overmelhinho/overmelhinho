<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Observers\AuditObserver;
use App\Models\Cliente;
use App\Models\Lead;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        \App\Models\Cliente::observe(\App\Observers\ClienteObserver::class);
    }
}
