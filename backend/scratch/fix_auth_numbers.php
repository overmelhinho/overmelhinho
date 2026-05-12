<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Autorizacao;

$autorizacoes = Autorizacao::all();
foreach ($autorizacoes as $a) {
    $current = (string) $a->numero;
    if (str_contains($current, '-')) {
        [$p, $s] = explode('-', $current);
        $new = str_pad($p, 5, '0', STR_PAD_LEFT) . '-' . $s;
    } else {
        $new = str_pad($current, 5, '0', STR_PAD_LEFT);
    }

    if ($new !== $current) {
        $a->numero = $new;
        $a->save();
        echo "ID {$a->id}: {$current} -> {$new}\n";
    }
}
