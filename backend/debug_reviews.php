<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cliente;
use App\Models\ClienteReview;

$clienteId = 48;
echo "--- Verificando Cliente ID: $clienteId ---\n";
$c = Cliente::find($clienteId);

if (!$c) {
    die("Cliente 48 não encontrado.\n");
}

echo "Google Place ID: " . $c->google_place_id . "\n";
echo "Horário Atendimento (JSON): " . json_encode($c->horario_atendimento) . "\n";

$counts = $c->reviews()->count();
echo "Total de reviews no banco: " . $counts . "\n";

$reviews = $c->reviews()->get();
foreach ($reviews as $rev) {
    echo "- ID: {$rev->id} | GoogleID: {$rev->google_review_id} | Author: {$rev->author_name} | Date: {$rev->relative_time_description}\n";
}

echo "--- Fim ---\n";
