<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

$cityCenters = [
    'farroupilha' => [-29.2272, -51.3486],
    'caxias do sul' => [-29.1682, -51.1794],
    'caxias de sul' => [-29.1682, -51.1794],
    'bento goncalves' => [-29.1691, -51.5188],
    'garibaldi' => [-29.2566, -51.5341],
    'carlos barbosa' => [-29.2974, -51.5034],
    'flores da cunha' => [-29.0287, -51.1824],
    'flores de cunha' => [-29.0287, -51.1824],
    'canela' => [-29.3664, -50.8122],
    'gramado' => [-29.3789, -50.8739],
    'lajeado' => [-29.4674, -51.9619],
    'campo bom' => [-29.6781, -51.0583],
    'novo hamburgo' => [-29.6842, -51.1311],
    'sao marcos' => [-28.9714, -51.0678],
    'feliz' => [-29.4533, -51.3094],
    'nova prata' => [-28.7844, -51.6092],
    'veranopolis' => [-28.9378, -51.5492]
];

$defaultCenter = [-29.1682, -51.1794]; // Caxias do Sul

echo "=== PASSO 1: Geocodificar Pagantes Ativos com Rua Válida ===\n";

$pagantes = DB::table('clientes')
    ->join('enderecos', 'clientes.id', '=', 'enderecos.cliente_id')
    ->where('clientes.tipo_cliente', 'pagante')
    ->whereIn('clientes.status_assinatura', ['ativa', 'ativo'])
    ->where(function($q) {
        $q->whereNull('enderecos.latitude')
          ->orWhere('enderecos.latitude', 0);
    })
    ->select('enderecos.id', 'clientes.nome_fantasia', 'enderecos.cidade', 'enderecos.bairro', 'enderecos.rua', 'enderecos.numero', 'enderecos.estado')
    ->get();

echo "Total de pagantes ativos sem coordenadas: " . $pagantes->count() . "\n";

$geocodedCount = 0;
$fallbackCount = 0;

foreach ($pagantes as $idx => $p) {
    $ruaClean = trim(strtolower($p->rua ?? ''));
    
    // Se a rua for vazia, "vazio" ou inexistente, pula geocodificação direta e coloca no fallback do passo 2
    if ($ruaClean === '' || $ruaClean === 'vazio' || $ruaClean === 's/n' || $ruaClean === '0') {
        continue;
    }

    echo "Geocodificando [{$idx}/" . $pagantes->count() . "]: {$p->nome_fantasia} (ID Endereço: {$p->id}) | Rua: {$p->rua}...\n";

    // Constrói query
    $numeroStr = ($p->numero && !in_array(strtolower(trim($p->numero)), ['s/n', '0', 's\n', 'sn', 's/nº'])) ? $p->numero . ' ' : '';
    $cleanRua = preg_replace('/ - .*/', '', $p->rua); // Limpa sufixos de travessas
    $queryString = $numeroStr . $cleanRua . ', ' . $p->cidade . ', ' . ($p->estado ?? 'RS') . ', Brasil';

    $success = false;
    try {
        $response = Http::withHeaders([
            'User-Agent' => 'OvermelhinhoDataMigrator/1.0 (daniel@overmelhinho.com.br)'
        ])->timeout(8)->get('https://nominatim.openstreetmap.org/search', [
            'q' => $queryString,
            'format' => 'json',
            'limit' => 1
        ]);

        if ($response->successful() && !empty($response->json())) {
            $data = $response->json()[0];
            $lat = (float) $data['lat'];
            $lng = (float) $data['lon'];

            DB::table('enderecos')->where('id', $p->id)->update([
                'latitude' => $lat,
                'longitude' => $lng
            ]);

            echo "  ✅ SUCESSO: Lat: {$lat} | Lng: {$lng}\n";
            $geocodedCount++;
            $success = true;
        } else {
            // Se falhou com rua limpa, tenta só a rua e cidade
            $queryStringSimple = $cleanRua . ', ' . $p->cidade . ', ' . ($p->estado ?? 'RS') . ', Brasil';
            $response = Http::withHeaders([
                'User-Agent' => 'OvermelhinhoDataMigrator/1.0 (daniel@overmelhinho.com.br)'
            ])->timeout(8)->get('https://nominatim.openstreetmap.org/search', [
                'q' => $queryStringSimple,
                'format' => 'json',
                'limit' => 1
            ]);

            if ($response->successful() && !empty($response->json())) {
                $data = $response->json()[0];
                $lat = (float) $data['lat'];
                $lng = (float) $data['lon'];

                DB::table('enderecos')->where('id', $p->id)->update([
                    'latitude' => $lat,
                    'longitude' => $lng
                ]);

                echo "  ✅ SUCESSO (Simples): Lat: {$lat} | Lng: {$lng}\n";
                $geocodedCount++;
                $success = true;
            }
        }
    } catch (\Exception $e) {
        echo "  🔥 ERRO: " . $e->getMessage() . "\n";
    }

    if (!$success) {
        echo "  ❌ Não localizado. Será atualizado via fallback de cidade.\n";
    }

    // Rate limit do Nominatim (1 req/s)
    sleep(1);
}

echo "\n=== PASSO 2: Aplicar Fallback de Cidade para TODOS os Endereços Restantes com Lat/Lng Nulo ou 0 ===\n";

$nulos = DB::table('enderecos')
    ->whereNull('latitude')
    ->orWhere('latitude', 0)
    ->select('id', 'cidade')
    ->get();

echo "Total de endereços restantes sem coordenadas para atualizar: " . $nulos->count() . "\n";

$updatedFallbacks = 0;
$chunkSize = 1000;
$chunks = $nulos->chunk($chunkSize);

foreach ($chunks as $chunkIndex => $chunk) {
    DB::transaction(function() use ($chunk, $cityCenters, $defaultCenter, &$updatedFallbacks) {
        foreach ($chunk as $end) {
            $normalizedCity = $end->cidade ? strtolower(Str::ascii($end->cidade)) : '';
            $normalizedCity = preg_replace('/\b(do|da|de)\b/', 'do', $normalizedCity);
            
            $baseCoords = $cityCenters[$normalizedCity] ?? $defaultCenter;
            
            // Desvio determinístico baseado no ID para que não fiquem sobrepostos
            $offsetLat = sin($end->id) * 0.008;
            $offsetLng = cos($end->id) * 0.008;
            
            $lat = round($baseCoords[0] + $offsetLat, 7);
            $lng = round($baseCoords[1] + $offsetLng, 7);
            
            DB::table('enderecos')->where('id', $end->id)->update([
                'latitude' => $lat,
                'longitude' => $lng
            ]);
            
            $updatedFallbacks++;
        }
    });
    echo "  Progresso: {$updatedFallbacks} / " . $nulos->count() . " atualizados...\n";
}

echo "\n=== CONCLUÍDO ===\n";
echo "Geocodificados via API: {$geocodedCount}\n";
echo "Atualizados via Fallback de Cidade: {$updatedFallbacks}\n";
