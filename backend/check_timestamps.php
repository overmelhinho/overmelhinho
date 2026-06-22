<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cliente;
use Illuminate\Support\Facades\DB;

$cliente = Cliente::find(106572);
if ($cliente) {
    echo "ID: " . $cliente->id . "\n";
    echo "Nome Fantasia: " . $cliente->nome_fantasia . "\n";
    echo "Status Assinatura: " . $cliente->status_assinatura . "\n";
    echo "Tipo Cliente: " . $cliente->tipo_cliente . "\n";
    echo "Exibir no Site: " . ($cliente->exibir_no_site ? 'Sim' : 'Não') . "\n";
    echo "Created At: " . $cliente->created_at . "\n";
    echo "Updated At: " . $cliente->updated_at . "\n";

    // Let's also check audit logs or changes if any
    $logs = DB::table('audit_logs') // or whatever audit table exists
        ->where('auditable_id', 106572)
        ->orWhere('cliente_id', 106572)
        ->get();
    echo "Audit logs count: " . count($logs) . "\n";
    foreach ($logs as $log) {
        echo json_encode($log) . "\n";
    }
} else {
    echo "Cliente 106572 not found.\n";
}
