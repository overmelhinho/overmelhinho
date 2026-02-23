<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;

use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\PermissionController;

use App\Http\Controllers\Api\V1\ClienteController;
use App\Http\Controllers\Api\V1\EnderecoController;
use App\Http\Controllers\Api\V1\ContatoController;
use App\Http\Controllers\Api\V1\RedeSocialController;
use App\Http\Controllers\Api\V1\GaleriaImagemController;

use App\Http\Controllers\UploadTempController;

use App\Http\Controllers\Api\V1\OportunidadeController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\SeoRankingController;

use App\Http\Controllers\LeadIntelController;
use App\Http\Controllers\Api\V1\SegmentoController;

use App\Http\Controllers\Api\V1\CidadeController;

use App\Http\Controllers\Api\V1\TicketController;
use App\Http\Controllers\Api\V1\JobRoleController;

use App\Http\Controllers\Api\V1\CampanhaController;

use App\Http\Controllers\Api\V1\CampanhaMidiaController;

use App\Http\Controllers\Api\V1\JobOpportunityController;
use App\Http\Controllers\Api\V1\CandidateController;

Route::post('/v1/upload-temp', [UploadTempController::class , 'uploadTemp']);

// ✅ Vagas PRO - Rotas Públicas (sem autenticação)
Route::get('/v1/jobs/public', [JobOpportunityController::class , 'indexPublic']);
Route::get('/v1/jobs/public/{id}', [JobOpportunityController::class , 'showPublic']);
Route::post('/v1/jobs/{id}/apply', [JobOpportunityController::class , 'apply']);

// ✅ Webhook Tiny (Desprotegido)
Route::post('/v1/webhooks/tiny', [\App\Http\Controllers\Api\V1\FinancialController::class , 'handleWebhook']);

Route::get('/v1/teste-segmento', fn() => response()->json(['msg' => 'rota simples ok']));
Route::get('/v1/segmentos', [SegmentoController::class , 'index']);
Route::get('/v1/cidades', [CidadeController::class , 'index']);

Route::post('/v1/login', [AuthController::class , 'login'])->middleware('throttle:5,1');
Route::post('/v1/password/email', [PasswordResetController::class , 'sendResetLinkEmail'])->middleware('throttle:3,1');
Route::post('/v1/password/reset', [PasswordResetController::class , 'reset']);

Route::get('/v1/lead-intel/diagnostico', [LeadIntelController::class , 'diagnostico']);

use App\Http\Controllers\Api\V1\NotificationController;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    Route::get('/user', [AuthController::class , 'user']);
    Route::post('/logout', [AuthController::class , 'logout']);

    // Notificações
    Route::get('/notifications', [NotificationController::class , 'index']);
    Route::post('/notifications/read-all', [NotificationController::class , 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class , 'markAsRead']);

    Route::apiResource('users', UserController::class);
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('permissions', PermissionController::class);

    Route::match (['patch', 'put'], '/user', [UserController::class , 'updateSelf']);

    Route::get('/clientes/{id}/historico', [ClienteController::class , 'historico']);
    Route::get('/clientes/{id}/seo-rankings', [SeoRankingController::class , 'getClientRankings']);
    Route::apiResource('clientes', ClienteController::class);

    Route::get('/job-roles', [JobRoleController::class , 'index']);
    Route::post('/job-roles', [JobRoleController::class , 'store']);

    Route::apiResource('clientes.enderecos', EnderecoController::class);
    Route::apiResource('clientes.contatos', ContatoController::class);
    Route::apiResource('clientes.redes-sociais', RedeSocialController::class);
    Route::apiResource('clientes.galeria', GaleriaImagemController::class);

    Route::post('/clientes/{id}/seo/keywords/generate', [ClienteController::class , 'generateSeoKeywords']);
    Route::patch('/clientes/{id}/seo/keywords', [ClienteController::class , 'updateSeoKeywords']);

    Route::post('clientes/{cliente}/galeria/upload', [GaleriaImagemController::class , 'upload']);
    Route::post('clientes/{cliente}/galeria/upload-multiplos', [GaleriaImagemController::class , 'uploadMultiple']);
    Route::post('clientes/{cliente}/galeria/commit-temp', [GaleriaImagemController::class , 'commitTemp']);

    // Logo
    Route::post('clientes/{cliente}/logo/commit-temp', [ClienteController::class , 'commitLogoTemp']);

    // ✅ Ticket (IMPORTANTE: rotas específicas antes do resource)
    Route::get('tickets/my-focus', [TicketController::class , 'myFocusQueue']);
    Route::get('tickets/assignees', [TicketController::class , 'assignees']);
    Route::post('tickets/{id}/subtasks', [TicketController::class , 'storeSubtask']);
    Route::patch('tickets/{id}/subtasks/{subtaskId}/toggle', [TicketController::class , 'toggleSubtask']);
    Route::delete('tickets/{id}/subtasks/{subtaskId}', [TicketController::class , 'destroySubtask']);
    Route::apiResource('tickets', TicketController::class)->only(['index', 'store', 'show', 'update']);

    // ✅ NOVO: Mídia (portfolio/cardápio/catálogo)
    Route::post('clientes/{cliente}/midia/commit-temp', [ClienteController::class , 'commitMidiaTemp']);

    // Campanhas
    Route::apiResource('campanhas', CampanhaController::class)->only(['index', 'store', 'show', 'update']);
    Route::post('campanhas/{campanha}/encerrar', [CampanhaController::class , 'encerrar']);
    Route::post('campanhas/{campanha}/renovar', [CampanhaController::class , 'renovar']);

    // ✅ Mídias de Campanha + Commit Temp
    Route::get('campanhas/{campanha}/midias', [CampanhaMidiaController::class , 'index']);

    // ✅ NOVO (C7): ativar por tipo+slot
    Route::post('campanhas/{campanha}/midias/{midia}/ativar', [CampanhaMidiaController::class , 'ativarMidia']);

    // ✅ C1: midias ativas derivadas (tipo + slot)
    Route::get('campanhas/{campanha}/midias/ativas', [CampanhaMidiaController::class , 'ativas']);

    // ✅ C2: detalhe de mídia
    Route::get('campanhas/{campanha}/midias/{midia}', [CampanhaMidiaController::class , 'showMidia']);

    // ✅ C3: arquivar (soft) mídia
    Route::delete('campanhas/{campanha}/midias/{midia}', [CampanhaMidiaController::class , 'destroyMidia']);

    Route::post('campanhas/{campanha}/midias/commit-temp', [CampanhaMidiaController::class , 'commitTemp']);
    Route::match (['patch', 'put'], 'campanhas/{campanha}/midias/{midia}', [CampanhaMidiaController::class , 'updateMidia']);

    Route::get('oportunidades/kanban', [OportunidadeController::class , 'kanban']);
    Route::patch('oportunidades/{id}/mover', [OportunidadeController::class , 'mover']);
    Route::apiResource('oportunidades', OportunidadeController::class);
    Route::apiResource('leads', LeadController::class);
    Route::post('leads/{lead}/send-followup', [LeadController::class , 'sendFollowup']);

    Route::post('leads/{lead}/converter', [LeadController::class , 'converterOportunidade']);
    Route::post('oportunidades/{oportunidade}/converter-cliente', [OportunidadeController::class , 'converterCliente']);

    Route::get('/leads/stats', [LeadController::class , 'stats'])->middleware('permission:view_lead');
    Route::get('/dashboard/kpis', [DashboardController::class , 'kpis']);
    Route::get('/dashboard/test', [DashboardController::class , 'test']);

    Route::get('/lead-intel/fetch', [LeadIntelController::class , 'fetch']);

    Route::get('/comerciais', fn() => \App\Models\User::role('Comercial')->get(['id', 'name', 'email']));

    // ✅ Vagas PRO - Rotas Protegidas (Admin)
    Route::apiResource('jobs', JobOpportunityController::class)->except(['create', 'edit']);
    Route::get('clients/{clientId}/candidates', [CandidateController::class , 'indexByClient']);
    Route::get('jobs/{jobId}/candidates', [CandidateController::class , 'indexByJob']);
    Route::patch('candidates/{id}/status', [CandidateController::class , 'updateStatus']);
    Route::get('candidates/{id}/resume', [CandidateController::class , 'downloadResume']);
    Route::delete('candidates/{id}', [CandidateController::class , 'destroy']);

    // ✅ Financeiro
    Route::get('/plans', [\App\Http\Controllers\Api\V1\PlanController::class , 'index']);
    Route::post('/plans', [\App\Http\Controllers\Api\V1\PlanController::class , 'store']);
    Route::get('/plans/{id}', [\App\Http\Controllers\Api\V1\PlanController::class , 'show']);
    Route::put('/plans/{id}', [\App\Http\Controllers\Api\V1\PlanController::class , 'update']);
    Route::post('/plans/{id}/sync', [\App\Http\Controllers\Api\V1\PlanController::class , 'sync']);
    Route::delete('/plans/{id}', [\App\Http\Controllers\Api\V1\PlanController::class , 'destroy']);

    Route::get('/clientes/{id}/invoices', [\App\Http\Controllers\Api\V1\FinancialController::class , 'indexClientInvoices']);
    Route::post('/clientes/{id}/invoices', [\App\Http\Controllers\Api\V1\FinancialController::class , 'storeInvoice']);

    // Listagem Geral de Faturas
    Route::get('/financial/invoices', [\App\Http\Controllers\Api\V1\FinancialController::class , 'indexAllInvoices']);
    Route::get('/financial/export-pdf', [\App\Http\Controllers\Api\V1\FinancialController::class , 'exportReport']);
    Route::get('/financial/group/{groupId}/carnet', [\App\Http\Controllers\Api\V1\FinancialController::class , 'exportCarnet']);
    Route::post('/financial/invoices/sync', [\App\Http\Controllers\Api\V1\FinancialController::class , 'syncInvoices']);
    Route::patch('/financial/invoices/{id}/status', [\App\Http\Controllers\Api\V1\FinancialController::class , 'updateStatus']);
});
