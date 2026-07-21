<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->is_active === false) {
            // Revoga todos os tokens do usuário bloqueado imediatamente
            $user->tokens()->delete();

            return response()->json([
                'message' => 'Sua conta foi bloqueada. Entre em contato com o administrador.',
                'blocked' => true,
            ], 403);
        }

        return $next($request);
    }
}
