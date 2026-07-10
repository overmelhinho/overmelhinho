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
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ClientReportController;

use App\Http\Controllers\Api\V1\RenewalController;
use App\Http\Controllers\Api\V1\AutorizacaoController;
use App\Http\Controllers\Api\V1\PublicAdController;

Route::post('/v1/upload-temp', [UploadTempController::class , 'uploadTemp']);

// ✅ Vagas PRO - Rotas Públicas (sem autenticação)
Route::get('/v1/jobs/public', [JobOpportunityController::class , 'indexPublic']);
Route::get('/v1/jobs/public/{id}', [JobOpportunityController::class , 'showPublic']);
Route::post('/v1/jobs/{id}/apply', [JobOpportunityController::class , 'apply']);

// ✅ Módulo de Renovação - Rotas Públicas
Route::get('/v1/renewals/magic-link/{token}', [RenewalController::class , 'showByToken']);
Route::post('/v1/renewals/magic-link/{token}/approve', [RenewalController::class , 'approve']);
Route::post('/v1/renewals/magic-link/{token}/update-data', [RenewalController::class , 'updateData']);

// ✅ Rotas Públicas de Autorizações/Contratos
Route::prefix('v1/autorizacoes')->group(function () {
    Route::get('/{id}/pdf',      [AutorizacaoController::class, 'generatePdf']);
    Route::get('/{id}/preview',  [AutorizacaoController::class, 'previewPdf']);
});

Route::prefix('v1/autorizar')->group(function () {
    Route::get('/{token}',  [AutorizacaoController::class, 'showByToken']);
    Route::post('/{token}', [AutorizacaoController::class, 'sign']);
});

// ✅ Webhook Tiny (Desprotegido)
Route::post('/v1/webhooks/tiny', [\App\Http\Controllers\Api\V1\FinancialController::class , 'handleWebhook']);

Route::get('/v1/teste-segmento', fn() => response()->json(['msg' => 'rota simples ok']));
Route::get('/v1/debug-deploy', function () {
    $frontendDir = __DIR__ . '/../../frontend/dist';
    $files = [];
    if (file_exists($frontendDir)) {
        exec("ls -la " . escapeshellarg($frontendDir) . " 2>&1", $out);
        $files['dist'] = $out;
    }
    if (file_exists($frontendDir . '/assets')) {
        exec("ls -la " . escapeshellarg($frontendDir . '/assets') . " 2>&1", $out2);
        $files['assets'] = $out2;
    }
    
    // Check VPS memory
    exec("free -m 2>&1", $mem);
    
    return ['msg' => 'ok', 'files' => $files, 'mem' => $mem];
});
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

    // Route::apiResource('users', UserController::class);
    Route::match (['patch', 'put'], '/user', [UserController::class , 'updateSelf']);

    // ⚠️ Rotas estáticas de clientes ANTES do apiResource (evita conflito com {id})
    Route::post('/clientes/ai-description', [ClienteController::class, 'generateAiDescription']);
    Route::get('/clientes/google-hours', [ClienteController::class, 'getGoogleHours']);
    Route::get('/clientes/google-lookup', [ClienteController::class, 'getPlaceIdByQuery']);
    Route::get('/clientes/ai-foundation', [ClienteController::class, 'getFoundationDateByAi']);
    Route::post('/clientes/parse-legacy-horario', [ClienteController::class, 'parseLegacyHorario']);

    Route::get('/clientes/{id}/google-reviews', [ClienteController::class, 'getGoogleReviews']);
    Route::post('/clientes/{id}/google-reviews', [ClienteController::class, 'saveGoogleReviews']);

    Route::get('/clientes/{id}/historico', [ClienteController::class , 'historico']);
    Route::post('/clientes/{id}/audit/save', [ClienteController::class, 'auditSave']);
    Route::get('/clientes/{id}/seo-rankings', [SeoRankingController::class , 'getClientRankings']);
    Route::post('/clientes/{id}/seo-rankings/sync', [SeoRankingController::class , 'syncClientRankings']);
    Route::get('/clientes/{id}/suggest-keywords', [ClienteController::class , 'keywordSuggestions']);
    Route::post('/clientes/{id}/seo/keywords/generate', [ClienteController::class , 'generateSeoKeywords']);
    Route::patch('/clientes/{id}/seo/keywords', [ClienteController::class , 'updateSeoKeywords']);
    Route::get('clientes/check-cnpj', [ClienteController::class, 'checkCnpj']);
    Route::get('clientes/google-reviews-lookup', [ClienteController::class, 'lookupGoogleReviews']);
    Route::post('/clientes/bulk-update-slugs', [ClienteController::class, 'bulkUpdateSlugs']);
    Route::apiResource('clientes', ClienteController::class);

    Route::get('/job-roles', [JobRoleController::class , 'index']);
    Route::post('/job-roles', [JobRoleController::class , 'store']);

    Route::apiResource('clientes.enderecos', EnderecoController::class);
    Route::apiResource('clientes.contatos', ContatoController::class);
    Route::apiResource('clientes.redes-sociais', RedeSocialController::class);
    Route::apiResource('clientes.galeria', GaleriaImagemController::class);

    Route::post('clientes/{cliente}/galeria/upload', [GaleriaImagemController::class , 'upload']);
    Route::post('clientes/{cliente}/galeria/upload-multiplos', [GaleriaImagemController::class , 'uploadMultiple']);
    Route::post('clientes/{cliente}/galeria/commit-temp', [GaleriaImagemController::class , 'commitTemp']);

    // ✅ Auditoria Inteligente
    Route::get('audit/queue', [ClienteController::class, 'auditQueue']);
    Route::get('audit/history', [ClienteController::class, 'auditHistory']);
    Route::get('audit/stats', [ClienteController::class, 'auditStats']);
    Route::get('audit/city-stats', [ClienteController::class, 'auditCityStats']);
    Route::get('audit/users', [ClienteController::class, 'auditUsers']);
    Route::post('audit/trigger-scan', [ClienteController::class, 'auditTriggerScan']);
    Route::post('audit/{clienteId}/force-scan', [ClienteController::class, 'auditForceScan']);

    // Logo
    Route::post('clientes/{cliente}/logo/commit-temp', [ClienteController::class , 'commitLogoTemp']);
    Route::post('clientes/{cliente}/banner/commit-temp', [ClienteController::class , 'commitBannerTemp']);

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
    Route::apiResource('campanhas', CampanhaController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::post('campanhas/{campanha}/encerrar', [CampanhaController::class , 'encerrar']);
    Route::post('campanhas/{campanha}/renovar', [CampanhaController::class , 'renovar']);
    Route::patch('campanhas/{campanha}/status', [CampanhaController::class , 'updateStatus']);

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
    Route::get('leads/stats', [LeadController::class , 'stats'])->middleware('permission:view_lead');
    Route::apiResource('leads', LeadController::class);
    Route::post('leads/{lead}/send-followup', [LeadController::class , 'sendFollowup']);

    Route::post('leads/{lead}/converter', [LeadController::class , 'converterOportunidade']);
    Route::post('oportunidades/{oportunidade}/converter-cliente', [OportunidadeController::class , 'converterCliente']);

    Route::apiResource('users', UserController::class);
    Route::get('/dashboard/kpis', [DashboardController::class , 'kpis']);
    Route::get('/dashboard/daily-quote', [DashboardController::class , 'dailyQuote']);


    Route::get('/dashboard/test', [DashboardController::class , 'test']);

    Route::get('/lead-intel/fetch', [LeadIntelController::class , 'fetch']);

    Route::get('/comerciais', fn() => \App\Models\User::role(['Comercial', 'Administrador', 'Admin', 'Diretor', 'Operador Geral'])->get(['id', 'name', 'email']));

    Route::post('/segmentos', [SegmentoController::class , 'store']);

    // ✅ Vagas PRO - Rotas Protegidas (Admin)
    Route::apiResource('jobs', JobOpportunityController::class)->except(['create', 'edit']);
    Route::get('clients/{clientId}/candidates', [CandidateController::class , 'indexByClient']);
    Route::get('jobs/{jobId}/candidates', [CandidateController::class , 'indexByJob']);
    Route::patch('candidates/{id}/status', [CandidateController::class , 'updateStatus']);
    Route::get('candidates/{id}/resume', [CandidateController::class , 'downloadResume']);
    Route::delete('candidates/{id}', [CandidateController::class , 'destroy']);

    // 🎯 Radar de Prospecção
    Route::get('prospect/search', [\App\Http\Controllers\Api\V1\ProspectController::class, 'search']);
    Route::post('prospect/convert-to-lead', [\App\Http\Controllers\Api\V1\ProspectController::class, 'convertToLead']);

    // ✅ Financeiro
    Route::get('/plans', [\App\Http\Controllers\Api\V1\PlanController::class , 'index']);
    Route::post('/plans', [\App\Http\Controllers\Api\V1\PlanController::class , 'store']);
    Route::get('/plans/{id}', [\App\Http\Controllers\Api\V1\PlanController::class , 'show']);
    Route::put('/plans/{id}', [\App\Http\Controllers\Api\V1\PlanController::class , 'update']);
    Route::post('/plans/{id}/sync', [\App\Http\Controllers\Api\V1\PlanController::class , 'sync']);
    Route::delete('/plans/{id}', [\App\Http\Controllers\Api\V1\PlanController::class , 'destroy']);

    Route::get('/clientes/{id}/invoices', [\App\Http\Controllers\Api\V1\FinancialController::class , 'indexClientInvoices']);
    Route::post('/clientes/{id}/invoices', [\App\Http\Controllers\Api\V1\FinancialController::class , 'storeInvoice']);

    Route::get('/financial/stats', [\App\Http\Controllers\Api\V1\FinancialController::class , 'getStats']);
    Route::get('/financial/invoices', [\App\Http\Controllers\Api\V1\FinancialController::class , 'indexAllInvoices']);
    Route::get('/financial/export-pdf', [\App\Http\Controllers\Api\V1\FinancialController::class , 'exportReport']);
    Route::get('/financial/group/{groupId}/carnet', [\App\Http\Controllers\Api\V1\FinancialController::class , 'exportCarnet']);
    Route::get('/financial/invoices/{id}/receipt', [\App\Http\Controllers\Api\V1\FinancialController::class , 'exportReceipt']);
    Route::post('/financial/invoices/batch-receipts', [\App\Http\Controllers\Api\V1\FinancialController::class , 'downloadReceiptsBatch']);
    Route::post('/financial/invoices/print-receipts', [\App\Http\Controllers\Api\V1\FinancialController::class , 'printReceiptsBatch']);
    Route::post('/financial/invoices/settle-batch', [\App\Http\Controllers\Api\V1\FinancialController::class , 'settleBatch']);
    Route::post('/financial/invoices/sync', [\App\Http\Controllers\Api\V1\FinancialController::class , 'syncInvoices']);
    Route::post('/financial/invoices/resend-to-tiny', [\App\Http\Controllers\Api\V1\FinancialController::class , 'resendToTiny']);
    Route::patch('/financial/invoices/{id}/status', [\App\Http\Controllers\Api\V1\FinancialController::class , 'updateStatus']);
    Route::patch('/financial/invoices/{id}/edit', [\App\Http\Controllers\Api\V1\FinancialController::class , 'updateInvoice']);
    Route::post('/financial/invoices/settle-group', [\App\Http\Controllers\Api\V1\FinancialController::class , 'settleGroup']);

    // ✅ Renovações (Admin)
    Route::get('/renewals', [RenewalController::class , 'index']);
    Route::post('/renewals/generate-link', [RenewalController::class , 'generateLink']);

    // ✅ Autorizações (Contratos de Publicidade)
    Route::prefix('autorizacoes')->group(function () {
        Route::get('/',          [AutorizacaoController::class, 'index']);
        Route::post('/',         [AutorizacaoController::class, 'store']);
        Route::get('/{id}',      [AutorizacaoController::class, 'show']);
        Route::put('/{id}',      [AutorizacaoController::class, 'update']);
        Route::delete('/{id}',   [AutorizacaoController::class, 'destroy']);
        Route::patch('/{id}/cancel', [AutorizacaoController::class, 'cancel']);
        Route::patch('/{id}/vendedor', [AutorizacaoController::class, 'transferVendedor']);
        Route::post('/{id}/send-link',       [AutorizacaoController::class, 'sendLink']);
        Route::post('/{id}/justify',         [AutorizacaoController::class, 'justify']);
        Route::post('/autorizacoes/{id}/assinatura/base64', [AutorizacaoController::class, 'processSignature']);

        // Alertas Tiny ERP
        Route::get('/alertas/tiny-cancellations', [AutorizacaoController::class, 'getPendingTinyCancellations']);
        Route::post('/alertas/tiny-cancellations/{id}/resolve', [AutorizacaoController::class, 'resolveTinyCancellation']);
        
        Route::post('/download-batch', [AutorizacaoController::class, 'downloadBatch']);
    });

    // ✅ Orçamentos com IA
    Route::get('/quotes', [\App\Http\Controllers\Api\V1\QuoteController::class, 'index']);
    Route::get('/clients/{id}/quotes-focus', [\App\Http\Controllers\Api\V1\QuoteController::class, 'indexFocus']);
    Route::patch('/quotes/{id}/status', [\App\Http\Controllers\Api\V1\QuoteController::class, 'updateStatus']);
    Route::post('/quotes/{id}/prospect-message', [\App\Http\Controllers\Api\V1\QuoteController::class, 'generateProspectMessage']);

    // Dashboards e Relatórios
    Route::get('/clients/{id}/reports/dashboard', [ReportController::class, 'clientDashboard']);
    Route::get('/admin/reports/dashboard', [ReportController::class, 'adminDashboard']);
    Route::get('/admin/reports/realtime', [ReportController::class, 'realtimeMetrics']);
    Route::get('/admin/reports/sales', [ReportController::class, 'salesReport']);
    Route::get('/admin/reports/sales/pdf', [ReportController::class, 'exportSalesPdf']);
    Route::get('/admin/reports/commissions', [ReportController::class, 'commissionReport']);
    Route::get('/admin/reports/jobs', [ReportController::class, 'jobReport']);
    Route::get('/admin/reports/jobs/clients', [ReportController::class, 'jobClients']);

    // 📄 Relatórios de Performance do Cliente
    Route::get('/clients/{id}/reports/preview', [ClientReportController::class, 'preview']);
    Route::post('/clients/{id}/reports', [ClientReportController::class, 'store']);
    Route::get('/clients/{id}/reports', [ClientReportController::class, 'index']);
    Route::patch('/reports/{id}/sent', [ClientReportController::class, 'markAsSent']);
    
    // ✅ Radar de Oportunidades (Gaps + IA)
    Route::get('/radar/oportunidades', [\App\Http\Controllers\Api\V1\RadarController::class, 'index']);
    Route::post('/radar/oportunidades/script', [\App\Http\Controllers\Api\V1\RadarController::class, 'generateScript']);
    Route::post('/radar/oportunidades/prospectar', [\App\Http\Controllers\Api\V1\RadarController::class, 'markAsProspected']);
    Route::get('/radar/oportunidades/alvos', [\App\Http\Controllers\Api\V1\RadarController::class, 'fetchTargets']);
    Route::get('/radar/oportunidades/alvos/detalhes', [\App\Http\Controllers\Api\V1\RadarController::class, 'getTargetDetails']);
    Route::post('/radar/oportunidades/alvos/prospectar', [\App\Http\Controllers\Api\V1\RadarController::class, 'markTargetAsProspected']);
    Route::get('/radar/roi', [\App\Http\Controllers\Api\V1\RadarController::class, 'getROI']);
});


// ✅ Rotas Públicas de Orçamentos e Tracking
Route::post('/v1/quotes', [\App\Http\Controllers\Api\V1\QuoteController::class, 'store'])->middleware('throttle:3,1');
Route::post('/v1/tracking/interaction', [\App\Http\Controllers\Api\V1\TrackingController::class, 'store']);
Route::post('/v1/tracking/ad-interaction', [\App\Http\Controllers\Api\V1\TrackingController::class, 'adInteraction']);
Route::post('/v1/tracking/search', [\App\Http\Controllers\Api\V1\TrackingController::class, 'search']);
Route::get('/v1/public/reports/{token}', [ClientReportController::class, 'showPublic']);
Route::get('/v1/public/sitemap-data', [\App\Http\Controllers\Api\V1\ClienteController::class, 'sitemap']);
Route::get('/v1/public/active-sitemap-combinations', [\App\Http\Controllers\Api\V1\ClienteController::class, 'activeSitemapCombinations']);
Route::get('/v1/public/debug-log', function () {
    $logPath = storage_path('logs/laravel.log');
    if (file_exists($logPath)) {
        $lines = file($logPath);
        $lastLines = array_slice($lines, -100);
        return response(implode("", $lastLines), 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
    return response('No log file found', 404);
});
Route::get('/v1/public/search', [\App\Http\Controllers\Api\V1\ClienteController::class, 'indexPublic']);
Route::get('/v1/public/search/suggestions', [\App\Http\Controllers\Api\V1\ClienteController::class, 'suggestions']);
Route::get('/v1/public/clientes/{id}', [\App\Http\Controllers\Api\V1\ClienteController::class, 'showPublic']);
Route::get('/v1/public/clientes/{id}/recommendations', [\App\Http\Controllers\Api\V1\ClienteController::class, 'recommendations']);



// ✅ Rotas de leads
Route::post('/v1/public/leads', [LeadController::class, 'store']);

// ✅ Campanhas e Anúncios Públicos
Route::get('/v1/public/ads', [PublicAdController::class, 'index']);
