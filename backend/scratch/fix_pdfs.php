<?php
use App\Models\Cliente;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

$legacy_db = [
    'driver'    => 'mysql',
    'host'      => '31.97.27.242',
    'database'  => 'overmelhinho',
    'username'  => 'overmelhinhocom',
    'password'  => 'w$JkD69Vzz6*n5',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
];

config(['database.connections.legacy' => $legacy_db]);
$legacyConn = DB::connection('legacy');

$clientesComPdfRuim = Cliente::where('portfolio_url', 'like', 'cardapios/%')->get();
echo "Encontrados " . $clientesComPdfRuim->count() . " clientes com PDFs em cardapios/ que precisam de fix...\n";

$supabaseUrl = rtrim(config('services.supabase.url', ''), '/');
$supabaseKey = config('services.supabase.key'); // SERVICE_ROLE key
$bucket = config('services.supabase.bucket', 'clientes-media');

$corrigidos = 0;

foreach ($clientesComPdfRuim as $cli) {
    // Buscar URL original no legado
    $legacyClient = $legacyConn->table('clientes')->where('id', $cli->id)->first();
    if (!$legacyClient || empty($legacyClient->cardapio)) {
        continue;
    }

    $urlCardapio = trim($legacyClient->cardapio);
    
    // Substituir domínio antigo pelo IP do legado para evitar erro de DNS (baixar o HTML 404)
    $urlLegadoSegura = str_replace(['http://overmelhinho.com.br', 'https://overmelhinho.com.br', 'http://www.overmelhinho.com.br', 'https://www.overmelhinho.com.br'], 'http://31.97.27.242', $urlCardapio);
    
    // Se não tiver http, prepend o IP
    if (!Str::startsWith($urlLegadoSegura, 'http')) {
        $urlLegadoSegura = 'http://31.97.27.242/' . ltrim($urlLegadoSegura, '/');
    }

    echo "Baixando de: {$urlLegadoSegura}\n";
    $fileContent = @file_get_contents($urlLegadoSegura);
    
    if ($fileContent && strlen($fileContent) > 1000) { // Se for muito pequeno, pode ser erro
        $extension = 'pdf'; // Assumimos PDF
        $filename = Str::uuid() . '.' . $extension;
        $path = "portfolios/{$cli->id}/{$filename}";
        
        $urlUpload = "{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}";

        $response = Http::withHeaders([
            'apikey'        => $supabaseKey,
            'Authorization' => "Bearer {$supabaseKey}",
            'Content-Type'  => 'application/pdf',
            'x-upsert'      => 'true',
        ])->withBody($fileContent, 'application/pdf')->post($urlUpload);

        if ($response->successful()) {
            $finalUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}";
            $cli->portfolio_url = $finalUrl;
            $cli->timestamps = false;
            $cli->save();
            echo "  -> Sucesso! Novo URL: {$finalUrl}\n";
            $corrigidos++;
        } else {
            echo "  -> ERRO no Supabase: " . $response->body() . "\n";
        }
    } else {
        echo "  -> ERRO ao baixar do IP legado (Pode não existir mais).\n";
    }
}
echo "Total corrigidos: {$corrigidos}\n";
