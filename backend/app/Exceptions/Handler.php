<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * Lista de exceções que não devem ser reportadas.
     */
    protected $dontReport = [];

    /**
     * Lista de inputs que nunca devem ser incluídos em mensagens de exceção.
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Registre as exceções e callbacks de tratamento.
     */
    public function register(): void
    {
        //
    }

    /**
     * Personalização de resposta para falha de autenticação
     */

protected function unauthenticated($request, \Illuminate\Auth\AuthenticationException $exception)
{
    if ($request->expectsJson()) {
        return response()->json(['error' => 'Não autenticado'], 401);
    }

    // Evita erro 500 ao não existir rota 'login'
    return response()->json(['error' => 'Rota de login não definida.'], 401);
}



}
