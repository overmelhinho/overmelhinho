<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\PermissionController;

// 👉 Import do ClienteController novo
use App\Http\Controllers\Api\V1\ClienteController;
use App\Http\Controllers\Api\V1\EnderecoController;
use App\Http\Controllers\Api\V1\ContatoController;
use App\Http\Controllers\Api\V1\RedeSocialController;
use App\Http\Controllers\Api\V1\GaleriaImagemController;

// Import Leads
use App\Http\Controllers\Api\V1\OportunidadeController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\DashboardController;

// Busca por IA Clientes
use App\Http\Controllers\LeadIntelController;



Route::prefix('v1')->group(function () {
    // 🔓 Rotas públicas (com rate limiting)
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    Route::post('/password/email', [PasswordResetController::class, 'sendResetLinkEmail'])
        ->middleware('throttle:3,1');

    Route::post('/password/reset', [PasswordResetController::class, 'reset']);


Route::get('/lead-intel/diagnostico', [LeadIntelController::class, 'diagnostico']);
    // 🔒 Rotas protegidas
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // --- CRUD de usuários ---
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

        // --- Histórico Clientes ---
        Route::get('/clientes/{id}/historico', [ClienteController::class, 'historico']);

        // --- CRUD de clientes ---
        Route::apiResource('clientes', ClienteController::class);

        // --- Endpoints expandidos de clientes ---
        Route::apiResource('clientes.enderecos', EnderecoController::class);
        Route::apiResource('clientes.contatos', ContatoController::class);
        Route::apiResource('clientes.redes-sociais', RedeSocialController::class);
        Route::apiResource('clientes.galeria', GaleriaImagemController::class);
        Route::post('clientes/{cliente}/galeria/upload', [GaleriaImagemController::class, 'upload']);
        Route::post('clientes/{cliente}/galeria/upload-multiplos', [GaleriaImagemController::class, 'uploadMultiple']);

        // --- CRUD LEADS/OPORTUNIDADES ---
        Route::get('oportunidades/kanban', [OportunidadeController::class, 'kanban']);
        Route::patch('oportunidades/{id}/mover', [OportunidadeController::class, 'mover']);
        Route::apiResource('oportunidades', OportunidadeController::class);
        Route::apiResource('leads', LeadController::class);
        Route::post('leads/{lead}/converter', [LeadController::class, 'converterOportunidade']);
        Route::post('oportunidades/{oportunidade}/converter-cliente', [OportunidadeController::class, 'converterCliente']);
	Route::get('/leads/stats', [LeadController::class, 'stats'])->middleware('permission:view_lead');
	Route::get('/dashboard/kpis', [DashboardController::class, 'kpis']);
	// dentro do Route::prefix('v1')->group
	Route::get('/dashboard/test', [DashboardController::class, 'test']);


	// Route Busca Clientes por IA
         Route::get('/lead-intel/fetch', [LeadIntelController::class, 'fetch']);

        // --- Usuários do time Comercial ---
        Route::get('/comerciais', function () {
            return \App\Models\User::role('Comercial')->get(['id', 'name', 'email']);
        });
    });
});
