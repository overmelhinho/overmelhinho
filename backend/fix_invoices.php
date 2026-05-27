<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cancelledAuths = \App\Models\Autorizacao::where('status', 'cancelado')->get();
$fixed = 0;

foreach ($cancelledAuths as $auth) {
    $affected = \App\Models\Invoice::where(function($q) use ($auth) {
        $q->where('group_id', 'autorizacao-' . $auth->id)
          ->orWhere('group_id', (string)$auth->id);
    })->where('status', 'pending')->update([
        'status' => 'canceled',
        'justification' => 'Cancelada retrospectivamente devido ao cancelamento da autorização mãe.',
        'action_date' => now(),
    ]);
    if ($affected > 0) {
        $fixed += $affected;
    }
}

echo "Corrigidas {$fixed} faturas pendentes de autorizacoes canceladas.\n";
