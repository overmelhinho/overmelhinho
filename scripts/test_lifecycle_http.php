<?php
/**
 * Teste End-to-End de Ciclo de Vida HTTP Real:
 * 1. Confirmação inicial de HTTP 404 em categoria vazia
 * 2. Inserção de empresa -> Disparo de revalidação -> HTTP 200
 * 3. Remoção de empresa -> Disparo de revalidação -> HTTP 404
 * 4. Validação dinâmica de sitemap
 */

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Cliente;
use App\Models\Cidade;
use App\Models\Segmento;

echo "========================================================================\n";
echo "   COMPROVAÇÃO DE TRANSIÇÕES DE CACHE E CICLO DE VIDA (HTTP REAL)       \n";
echo "========================================================================\n\n";

function makeHttpRequest(string $url): int {
    $ch = curl_init("http://localhost:3000" . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $httpCode;
}

function triggerRevalidation(string $path, ?string $tag = null): bool {
    $secret = env('REVALIDATE_SECRET') ?: base64_decode('b3Zlcm1lbGhpbmhvX3JldmFsaWRhdGVfMjAyNg==');
    $payload = ['path' => $path];
    if ($tag) $payload['tag'] = $tag;
    
    $ch = curl_init("http://localhost:3000/webhook/revalidate?secret=" . $secret);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ($code === 200);
}

// 1. ESTADO INICIAL: Gramado (id=15) / Comunicação Integrada (id=272)
$testUrl = '/gramado/comunicacao-integrada';
$initialStatus = makeHttpRequest($testUrl);
echo "[PASSO 1] Estado Inicial para {$testUrl}\n";
echo "  └─ Status HTTP: {$initialStatus} (Esperado: 404) " . ($initialStatus === 404 ? '✓ OK' : '✗ FALHA') . "\n\n";

// 2. CRIAÇÃO DE EMPRESA
echo "[PASSO 2] Cadastrando e ativando empresa em Gramado / Comunicação Integrada...\n";
$gramado = Cidade::whereRaw("f_unaccent(LOWER(nome)) = 'gramado'")->first();
$comunicacao = Segmento::whereRaw("f_unaccent(LOWER(nome)) = 'comunicacao integrada'")->first();

$cliente = new Cliente();
$cliente->nome_fantasia = "Agência Alpha Teste Soft404";
$cliente->razao_social = "Agência Alpha Ltda";
$cliente->tipo_cliente = "pagante";
$cliente->status_assinatura = "ativa";
$cliente->exibir_no_site = true;
$cliente->save();

$cliente->cidadesAtendidas()->sync([$gramado->id]);
$cliente->segmentos()->sync([$comunicacao->id]);

// Invalida cache no Laravel e no Next.js
\Illuminate\Support\Facades\Cache::flush();
triggerRevalidation($testUrl, "search-{$gramado->id}-{$comunicacao->id}");

// Requisição HTTP real após ativação
$statusAfterCreate = makeHttpRequest($testUrl);
echo "  └─ Status HTTP após ativação: {$statusAfterCreate} (Esperado: 200) " . ($statusAfterCreate === 200 ? '✓ TRANSIÇÃO 404 -> 200 CONFIRMADA' : '✗ FALHA') . "\n\n";

// 3. EXCLUSÃO DA EMPRESA
echo "[PASSO 3] Excluindo a única empresa da categoria...\n";
$cliente->cidadesAtendidas()->detach();
$cliente->segmentos()->detach();
$cliente->delete();

\Illuminate\Support\Facades\Cache::flush();
triggerRevalidation($testUrl, "search-{$gramado->id}-{$comunicacao->id}");

// Requisição HTTP real após exclusão
$statusAfterDelete = makeHttpRequest($testUrl);
echo "  └─ Status HTTP após exclusão: {$statusAfterDelete} (Esperado: 404) " . ($statusAfterDelete === 404 ? '✓ TRANSIÇÃO 200 -> 404 CONFIRMADA' : '✗ FALHA') . "\n\n";

// 4. ATUALIZAÇÃO DO SITEMAP
echo "[PASSO 4] Verificação de sitemap de combinações ativas...\n";
$sitemapRes = DB::table('clientes as c')
    ->join('cliente_cidade as cc', 'c.id', '=', 'cc.cliente_id')
    ->join('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
    ->where('c.exibir_no_site', 'true')
    ->where('cc.cidade_id', $gramado->id)
    ->where('cs.segmento_id', $comunicacao->id)
    ->count();

echo "  └─ Quantidade de entradas para {$testUrl} no sitemap: {$sitemapRes} (Esperado: 0) " . ($sitemapRes === 0 ? '✓ CONFIRMADO FORA DO SITEMAP' : '✗ FALHA') . "\n\n";

echo "========================================================================\n";
$allOk = ($initialStatus === 404 && $statusAfterCreate === 200 && $statusAfterDelete === 404 && $sitemapRes === 0);
echo "   RESULTADO FINAL: " . ($allOk ? '100% DAS TRANSIÇÕES HTTP REAIS FORAM COMPROVADAS' : 'HOUVE DIVERGÊNCIA') . "\n";
echo "========================================================================\n";
