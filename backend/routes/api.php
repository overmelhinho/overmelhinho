<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\SegmentoController;
use App\Models\Cliente;

// ✅ Suporte global a CORS: trata requisições OPTIONS (preflight)
Route::options('{any}', function () {
    return response()->json([], 204);
})->where('any', '.*');

Route::post('/login', [AuthController::class, 'requestLogin']);
Route::post('/verify-login', [VerificationController::class, 'verifyAndLogin']);

// ✅ Rota de teste Supabase
Route::get('/test-supabase', function () {
    return Cliente::create([
        'nome_fantasia' => 'Loja de Teste',
        'cpf_cnpj' => '12345678000199',
    ]);
});

// ✅ Grupo de rotas versionadas
Route::prefix('v1')->group(function () {
    Route::apiResource('leads', LeadController::class)->only(['store']);

    // ✅ Rota para obter segmentos
    Route::get('/segmentos', [SegmentoController::class, 'index']);
});
