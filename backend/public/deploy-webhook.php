<?php
/**
 * GitHub Webhook Auto-Deploy
 * 
 * Este script é chamado pelo GitHub quando um push é feito no repositório.
 * Ele executa o deploy automaticamente no VPS.
 * 
 * CONFIGURAÇÃO: Defina o mesmo segredo usado no GitHub Webhooks.
 */

$secret = getenv('DEPLOY_WEBHOOK_SECRET') ?: 'overmelhinho_deploy_2026';
$logFile = __DIR__ . '/../storage/logs/deploy.log';
$rootDir = '/var/www';

// --- Helpers ---
function logMsg(string $msg, string $logFile): void {
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL;
    file_put_contents($logFile, $line, FILE_APPEND);
    echo $line;
}

// --- Validação do Método ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die('Method Not Allowed');
}

// --- Validação da Assinatura do GitHub ---
$payload = file_get_contents('php://input');
$githubSignature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';

if (empty($githubSignature)) {
    http_response_code(401);
    logMsg('ERRO: Requisição sem assinatura GitHub.', $logFile);
    die('Unauthorized - No signature');
}

$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $secret);

if (!hash_equals($expectedSignature, $githubSignature)) {
    http_response_code(403);
    logMsg('ERRO: Assinatura inválida recebida: ' . $githubSignature, $logFile);
    die('Forbidden - Invalid signature');
}

// --- Apenas branch "main" ---
$data = json_decode($payload, true);
$branch = $data['ref'] ?? '';

if ($branch !== 'refs/heads/main') {
    http_response_code(200);
    logMsg("IGNORADO: Push no branch '{$branch}' (esperado: main).", $logFile);
    die('Ignored - Not main branch');
}

logMsg('=== DEPLOY INICIADO ===', $logFile);
logMsg('Commit: ' . ($data['after'] ?? 'N/A'), $logFile);
logMsg('Pusher: ' . ($data['pusher']['name'] ?? 'N/A'), $logFile);

// --- Resposta imediata ao GitHub (evita timeout) ---
http_response_code(200);
header('Content-Type: text/plain');
echo "Deploy iniciado...\n";
flush();

// Fecha a conexão com o GitHub antes de executar o build (que pode demorar)
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

// --- Executa o deploy via script existente (com lock file para evitar concorrência) ---
$deployScript = '/var/www/deploy.sh';

if (!file_exists($deployScript)) {
    logMsg("ERRO: Script de deploy não encontrado em {$deployScript}", $logFile);
    exit(1);
}

$command = "sudo bash {$deployScript} >> {$logFile} 2>&1 &";
logMsg("Executando: sudo bash {$deployScript}", $logFile);
exec($command);

logMsg('=== WEBHOOK FINALIZADO (Deploy rodando em background) ===', $logFile);
