<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Cliente;

function debug_q($q) {
    echo "\n--- Buscando por: '$q' ---\n";
    $normalizedQ = trim(preg_replace('/^(o|a|os|as|de|do|da)\s+/i', '', $q));
    echo "Normalizada: '$normalizedQ'\n";

    static $canUseSimilarity = null;
    if ($canUseSimilarity === null) {
        try {
            DB::select('SELECT similarity(\'a\', \'b\')');
            $canUseSimilarity = true;
            echo "Similarity: ATIVA\n";
        } catch (\Exception $e) {
            $canUseSimilarity = false;
            echo "Similarity: INATIVA (" . $e->getMessage() . ")\n";
        }
    }

    $query = Cliente::query()->where(function($sub) use ($q, $normalizedQ, $canUseSimilarity) {
        $sub->where('nome_fantasia', 'ilike', "%{$q}%")
            ->orWhere('nome_alternativo', 'ilike', "%{$q}%");

        if ($canUseSimilarity) {
            $sub->orWhereRaw("similarity(nome_fantasia, ?) > 0.15", [$normalizedQ])
                ->orWhereRaw("similarity(nome_alternativo, ?) > 0.15", [$normalizedQ]);
        } else {
            $words = explode(' ', $normalizedQ);
            foreach ($words as $word) {
                if (strlen($word) > 2) {
                    $sub->orWhere('nome_fantasia', 'ilike', "%{$word}%");
                }
            }
        }
    });

    $results = $query->limit(5)->get();
    echo "Resultados: " . $results->count() . "\n";
    foreach ($results as $res) {
        echo " - ID: {$res->id} | Nome: {$res->nome_fantasia}\n";
    }
}

debug_q('vermelhinho');
debug_q('vermelinho');
debug_q('o vermelinio');
