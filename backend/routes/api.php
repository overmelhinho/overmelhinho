<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;


Route::prefix('v1')->group(function () {
    // 🔓 Rotas públicas
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/password/email', [PasswordResetController::class, 'sendResetLinkEmail']);
    Route::post('/password/reset', [PasswordResetController::class, 'reset']);

    // 🔒 Rotas protegidas
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

