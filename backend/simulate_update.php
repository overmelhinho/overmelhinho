<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$aut = App\Models\Autorizacao::find(41295);

// Check if invoices exist
$invoices = App\Models\Invoice::where('group_id', 'autorizacao-41295')->count();
echo "Before Update - Invoices: $invoices\n";

// Let's call update on controller
$controller = new App\Http\Controllers\Api\V1\AutorizacaoController();
$request = Illuminate\Http\Request::create('/api/v1/autorizacoes/41295', 'PUT', [
    'valor_total' => 762,
    'num_parcelas' => 3,
    'parcelas' => [
        ['vencimento' => '2026-07-10'],
        ['vencimento' => '2026-08-10'],
        ['vencimento' => '2026-09-10'],
    ]
]);

$response = $controller->update($request, 41295);

$invoicesAfter = App\Models\Invoice::where('group_id', 'autorizacao-41295')->count();
echo "After Update - Invoices: $invoicesAfter\n";
