<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;

try {
    $innerQuery = AuditLog::selectRaw('DISTINCT ON (actor_user_id, cliente_id, DATE(created_at)) audit_logs.*')
        ->where('action', 'ilike', '%audit%')
        ->orderByRaw('actor_user_id, cliente_id, DATE(created_at), created_at DESC');

    $res = AuditLog::fromSub($innerQuery, 'audit_logs')
        ->with(['actor', 'cliente'])
        ->orderBy('created_at', 'desc')
        ->paginate(10);
    
    echo json_encode(['total' => $res->total(), 'items' => count($res->items())]);
} catch (\Exception $e) {
    echo $e->getMessage();
}
