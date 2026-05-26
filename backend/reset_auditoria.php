<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    DB::beginTransaction();

    // 1. Apagar histórico de auditoria
    $deletedLogs = DB::table('audit_logs')->where('action', 'ilike', '%audit%')->delete();

    // 2. Resetar campos na tabela clientes
    $updatedClientes = DB::table('clientes')->update([
        'audit_status' => 'pending',
        'last_audit_at' => null,
        'audit_differences' => null
    ]);

    // 3. Limpar jobs antigos pendentes caso haja varreduras travadas
    $deletedJobs = DB::table('jobs')->where('payload', 'like', '%AuditScanRoutine%')->delete();

    DB::commit();

    echo "=== RESET DE AUDITORIA CONCLUIDO ===" . PHP_EOL;
    echo "Logs apagados: " . $deletedLogs . PHP_EOL;
    echo "Clientes resetados: " . $updatedClientes . PHP_EOL;
    echo "Jobs na fila cancelados: " . $deletedJobs . PHP_EOL;

} catch (\Exception $e) {
    DB::rollBack();
    echo "ERRO: " . $e->getMessage() . PHP_EOL;
}
