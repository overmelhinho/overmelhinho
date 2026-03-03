<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Centro de Farroupilha - RS (Serra Gaúcha)
// Coordenadas reais: -29.2200, -51.3450
$centerLat = -29.2200;
$centerLng = -51.3450;

// Raio máximo de espalhamento (~4km)
$radius = 0.035;

// Reseta TODOS os endereços para as coordenadas de Farroupilha
$enderecos = DB::table('enderecos')->get();

$count = 0;
foreach ($enderecos as $endereco) {
    // Coordenadas pseudo-aleatórias, mas reproduzíveis (seed baseada no ID)
    srand($endereco->id * 31337);
    $deltaLat = ((rand(0, 200) - 100) / 100) * $radius;
    $deltaLng = ((rand(0, 200) - 100) / 100) * $radius;

    DB::table('enderecos')
        ->where('id', $endereco->id)
        ->update([
            'latitude'  => round($centerLat + $deltaLat, 7),
            'longitude' => round($centerLng + $deltaLng, 7),
        ]);
    $count++;
}

echo "✅ {$count} endereços atualizados para Farroupilha, RS\n";
echo "   Centro: {$centerLat}, {$centerLng}\n";
echo "   Raio: ±{$radius} graus (~4km)\n";
