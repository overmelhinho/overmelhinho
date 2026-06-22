<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;
use Illuminate\Support\Facades\DB;

$client = Cliente::where('nome_fantasia', 'like', '%Cliente E2E%')->first();
if (!$client) {
    echo "No client found matching Cliente E2E\n";
    exit(0);
}

echo "Found Client: ID={$client->id}, Nome={$client->nome_fantasia}\n";

try {
    // Try to replicate the delete logic from ClienteController
    DB::beginTransaction();
    
    $client->enderecos()->delete();
    $client->contatos()->delete();
    $client->redesSociais()->delete();
    $client->galeriaImagens()->delete();
    $client->reviews()->delete();
    $client->renewals()->delete();
    $client->invoices()->delete();
    $client->interacoes()->delete();
    $client->jobOpportunities()->delete();

    // Pivot tables
    $client->segmentos()->detach();
    $client->cidadesAtendidas()->detach();

    $client->delete();

    DB::commit();
    echo "Deletion successful!\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Deletion FAILED!\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
