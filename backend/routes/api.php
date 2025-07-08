<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;

Route::prefix('v1')->group(function () {
    // 🔓 Rotas públicas (com rate limiting)
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1'); // 5 tentativas por minuto por IP

    Route::post('/password/email', [PasswordResetController::class, 'sendResetLinkEmail'])
        ->middleware('throttle:3,1'); // 3 tentativas por minuto por IP

    Route::post('/password/reset', [PasswordResetController::class, 'reset']);

    // 🔒 Rotas protegidas
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});
