<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceCloseConnection
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Forçar fechamento da conexão HTTP para evitar deadlock/block em servidores single-thread locais (Windows php artisan serve)
        if (config('app.env') === 'local') {
            $response->headers->set('Connection', 'close');
        }

        return $response;
    }
}
