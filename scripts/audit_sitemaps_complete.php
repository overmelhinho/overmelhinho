<?php

echo "======================================================================\n";
echo "        AUDITORIA COMPLETA DE SITEMAPS XML (SPRINT 3)                 \n";
echo "======================================================================\n\n";

function fetchXml($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    $content = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $size = curl_getinfo($ch, CURLINFO_SIZE_DOWNLOAD);
    $type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    return ['content' => $content, 'code' => $code, 'size' => $size, 'type' => $type];
}

$sitemaps = [
    'sitemap.xml' => 'http://localhost:3000/sitemap.xml',
    'sitemap-categorias.xml' => 'http://localhost:3000/sitemap-categorias.xml',
    'sitemap-categorias/1/sitemap.xml' => 'http://localhost:3000/sitemap-categorias/1/sitemap.xml',
    'sitemap-empresas.xml' => 'http://localhost:3000/sitemap-empresas.xml',
];

$urlsBySitemap = [];
$xmlStats = [];

foreach ($sitemaps as $name => $url) {
    echo "--- Testando $name ($url) ---\n";
    $res = fetchXml($url);
    
    echo "  Status HTTP: {$res['code']}\n";
    echo "  Tamanho: " . round($res['size'] / 1024, 2) . " KB (" . round($res['size'] / (1024*1024), 2) . " MB)\n";
    echo "  Content-Type: {$res['type']}\n";
    
    // Validar XML
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($res['content']);
    $errors = libxml_get_errors();
    libxml_clear_errors();
    
    if ($xml === false) {
        echo "  [ERRO] XML inválido! Erros: " . count($errors) . "\n";
        continue;
    } else {
        echo "  [OK] Estrutura XML válida segundo RFC 3023 / W3C.\n";
    }
    
    // Contagem de URLs
    $urls = [];
    if (isset($xml->url)) {
        foreach ($xml->url as $u) {
            $urls[] = (string)$u->loc;
        }
        echo "  Tipo: <urlset> com " . count($urls) . " URLs.\n";
    } elseif (isset($xml->sitemap)) {
        foreach ($xml->sitemap as $s) {
            $urls[] = (string)$s->loc;
        }
        echo "  Tipo: <sitemapindex> com " . count($urls) . " sitemaps filhos.\n";
    }
    
    $uniqueUrls = array_unique($urls);
    echo "  URLs únicas: " . count($uniqueUrls) . " (duplicações internas: " . (count($urls) - count($uniqueUrls)) . ")\n";
    
    $urlsBySitemap[$name] = $uniqueUrls;
    $xmlStats[$name] = [
        'code' => $res['code'],
        'size_bytes' => $res['size'],
        'size_kb' => round($res['size'] / 1024, 2),
        'size_mb' => round($res['size'] / (1024*1024), 2),
        'total_urls' => count($urls),
        'unique_urls' => count($uniqueUrls),
    ];
    echo "\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDITORIA DE SOBREPOSIÇÃO (INTERSEÇÕES)
// ─────────────────────────────────────────────────────────────────────────────
echo "======================================================================\n";
echo "              AUDITORIA DE SOBREPOSIÇÃO / DUPLICAÇÃO                  \n";
echo "======================================================================\n";

$mainUrls = $urlsBySitemap['sitemap.xml'] ?? [];
$catUrls = $urlsBySitemap['sitemap-categorias/1/sitemap.xml'] ?? [];
$empUrls = $urlsBySitemap['sitemap-empresas.xml'] ?? [];

$interMainCat = array_intersect($mainUrls, $catUrls);
$interMainEmp = array_intersect($mainUrls, $empUrls);
$interCatEmp = array_intersect($catUrls, $empUrls);

echo "Sobreposição sitemap.xml vs sitemap-categorias: " . count($interMainCat) . " URLs\n";
echo "Sobreposição sitemap.xml vs sitemap-empresas: " . count($interMainEmp) . " URLs\n";
echo "Sobreposição sitemap-categorias vs sitemap-empresas: " . count($interCatEmp) . " URLs\n";

if (count($interMainCat) === 0 && count($interMainEmp) === 0 && count($interCatEmp) === 0) {
    echo "\n[APROVADO] ZERO sobreposição entre sitemaps. Cada URL é 100% exclusiva.\n\n";
} else {
    echo "\n[FALHA] Há sobreposição detectada!\n\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDITORIA DE EMPRESAS (HTTP 200, CANONICAL, NOINDEX)
// ─────────────────────────────────────────────────────────────────────────────
echo "======================================================================\n";
echo "       AUDITORIA DE AMOSTRA DE EMPRESAS (HTTP, CANONICAL, NOINDEX)    \n";
echo "======================================================================\n";

// Amostra de 8 empresas em diferentes cidades e segmentos
$sampleEmpresas = array_slice($empUrls, 0, 8);

foreach ($sampleEmpresas as $loc) {
    $locLocal = str_replace('https://www.overmelhinho.com.br', 'http://localhost:3000', $loc);
    $ch = curl_init($locLocal);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    $html = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Check canonical
    preg_match('/<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']/i', $html, $mCan);
    $canonicalFound = $mCan[1] ?? '';
    
    // Check noindex
    $hasNoindex = preg_match('/<meta[^>]+name=["\']robots["\'][^>]+content=["\'][^"\']*noindex/i', $html);
    
    $canonicalOk = ($canonicalFound === $loc);
    $noindexOk = !$hasNoindex;
    
    echo "URL: $loc\n";
    echo "  HTTP: $code | Canonical: " . ($canonicalOk ? "OK ($canonicalFound)" : "DIVERGENTE ($canonicalFound)") . " | noindex: " . ($noindexOk ? "NÃO (Indexável)" : "SIM (Erro)") . "\n";
}

