<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\Api\V1\UserController; // Caminho correto do UserController novo
use App\Http\Controllers\Api\V1\RoleController; // Novo Controller
use App\Http\Controllers\Api\V1\PermissionController; // Novo Controller


Route::get('/sanidade', function () {
    \Log::info('Sanidade OK');
    return response()->json(['ok' => true, 'msg' => 'Sanidade OK']);
});

Route::prefix('v1')->group(function () {
    // 🔓 Rotas públicas (com rate limiting)
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    Route::post('/password/email', [PasswordResetController::class, 'sendResetLinkEmail'])
        ->middleware('throttle:3,1');

    Route::post('/password/reset', [PasswordResetController::class, 'reset']);

    // 🔒 Rotas protegidas
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // --- CRUD de usuários (apenas admin/diretor) ---
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // --- Atualização do próprio usuário ---
        Route::patch('/user', [UserController::class, 'updateSelf']);
        Route::put('/user', [UserController::class, 'updateSelf']);

        // --- CRUD de roles ---
        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/roles/{id}', [RoleController::class, 'show']);
        Route::put('/roles/{id}', [RoleController::class, 'update']);
        Route::delete('/roles/{id}', [RoleController::class, 'destroy']);

        // --- CRUD de permissions ---
        Route::get('/permissions', [PermissionController::class, 'index']);
        Route::post('/permissions', [PermissionController::class, 'store']);
        Route::get('/permissions/{id}', [PermissionController::class, 'show']);
        Route::put('/permissions/{id}', [PermissionController::class, 'update']);
        Route::delete('/permissions/{id}', [PermissionController::class, 'destroy']);
    });
});

