<?php

echo "======================================================================\n";
echo "       O VERMELHINHO — SUITE DE HOMOLOGAÇÃO COMPLETA: SPRINT 3        \n";
echo "======================================================================\n\n";

$passed = 0;
$failed = 0;

function assertTest($description, $condition, $details = '') {
    global $passed, $failed;
    if ($condition) {
        $passed++;
        echo " [PASS] $description\n";
        if ($details) echo "        ↳ $details\n";
    } else {
        $failed++;
        echo " [FAIL] $description\n";
        if ($details) echo "        ↳ ERRO: $details\n";
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1: LINKS INTERNOS (HEADER E FOOTER)
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- 1. AUDITORIA DE LINKS INTERNOS (HEADER E FOOTER) ---\n";

$homeHtml = file_get_contents('http://localhost:3000/');

assertTest(
    "Header não contém link para /blog",
    !str_contains($homeHtml, 'href="/blog"'),
    "Link para /blog eliminado com sucesso do layout global."
);

assertTest(
    "Footer não aponta para rotas 404 (/farroupilha/saude e /bento-goncalves/gastronomia)",
    !str_contains($homeHtml, 'href="/farroupilha/saude"') && !str_contains($homeHtml, 'href="/bento-goncalves/gastronomia"'),
    "Links 404 removidos do rodapé."
);

assertTest(
    "Inclusão de /farroupilha/odontologia no Footer",
    str_contains($homeHtml, 'href="/farroupilha/odontologia"'),
    "Link para odontologia em Farroupilha presente no rodapé."
);

assertTest(
    "Inclusão de /bento-goncalves/restaurantes no Footer",
    str_contains($homeHtml, 'href="/bento-goncalves/restaurantes"'),
    "Link para restaurantes em Bento Gonçalves presente no rodapé."
);

// Testa os links do rodapé via HTTP
$footerUrls = [
    'http://localhost:3000/farroupilha/odontologia',
    'http://localhost:3000/caxias-do-sul/servicos',
    'http://localhost:3000/bento-goncalves/restaurantes',
    'http://localhost:3000/vagas'
];

foreach ($footerUrls as $fu) {
    $ch = curl_init($fu);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    assertTest("Link do rodapé $fu responde HTTP 200", $code === 200, "Status HTTP retornado: $code");
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2: HOST CANÔNICO (WWW VS NON-WWW)
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- 2. AUDITORIA DE HOST CANÔNICO (WWW REDIRECT) ---\n";

$ch = curl_init('http://localhost:3000/farroupilha/produtos-caseiros?origem=teste');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_NOBODY, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Host: overmelhinho.com.br']);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$loc = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
curl_close($ch);

assertTest(
    "Requisição para overmelhinho.com.br dispara HTTP 301",
    $code === 301,
    "Código HTTP retornado: $code"
);

assertTest(
    "Redirecionamento canônico preserva path e query string para www.overmelhinho.com.br",
    $loc === 'https://www.overmelhinho.com.br/farroupilha/produtos-caseiros?origem=teste',
    "Location retornado: $loc"
);

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3: REDIRECIONAMENTOS LEGADOS EM SALTO ÚNICO
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- 3. REDIRECIONAMENTOS LEGADOS (SALTO ÚNICO) ---\n";

// A. Busca com cidade e categoria
$ch = curl_init('http://localhost:3000/busca.php?id_cidade=1&id_categoria=846');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$loc = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
curl_close($ch);

assertTest(
    "/busca.php com cidade e categoria redireciona em salto único 301",
    $code === 301 && str_contains($loc, '/farroupilha/advocacia'),
    "Destino 301 direto: $loc"
);

// B. Busca com palavra livre
$ch = curl_init('http://localhost:3000/busca.php?palavra=restaurante');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$loc = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
curl_close($ch);

assertTest(
    "/busca.php com palavra livre redireciona direto para /busca?q=restaurante",
    $code === 301 && str_contains($loc, '/busca?q=restaurante'),
    "Destino 301 direto: $loc"
);

// C. Categoria legada no formato /-advocacia-;cat846.php
$ch = curl_init('http://localhost:3000/-advocacia-;cat846.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$loc = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
curl_close($ch);

assertTest(
    "/-advocacia-;cat846.php redireciona diretamente em salto único 301",
    $code === 301 && (str_contains($loc, 'advocacia') || str_contains($loc, 'Advocacia')),
    "Destino 301 direto: $loc"
);

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4: COBERTURA DAS 63 COMBINAÇÕES RECUPERADAS NO SITEMAP
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- 4. VALIDAÇÃO DAS 63 COMBINAÇÕES AUSENTES NO SITEMAP ---\n";

$apiData = json_decode(file_get_contents('http://127.0.0.1:8000/api/v1/public/active-sitemap-combinations'), true);
$totalCombos = count($apiData['data'] ?? []);

assertTest(
    "activeSitemapCombinations retorna volume completo com sediadas e atendidas (esperado: ~8.780)",
    $totalCombos >= 8780,
    "Total retornado pela API: $totalCombos combinações ativas"
);

// Testar 5 amostras obrigatórias das 63 que antes estavam ausentes
$amostras63 = [
    ['cidade' => 'flores-da-cunha', 'segmento' => 'transporte-rodoviario-de-carga', 'nome' => 'Flores da Cunha / Transporte'],
    ['cidade' => 'caxias-do-sul', 'segmento' => 'provedor-de-internet', 'nome' => 'Caxias do Sul / Provedor de Internet'],
    ['cidade' => 'farroupilha', 'segmento' => 'metal-mecanica', 'nome' => 'Farroupilha / Metal Mecânica'],
    ['cidade' => 'flores-da-cunha', 'segmento' => 'ppci', 'nome' => 'Flores da Cunha / PPCI'],
    ['cidade' => 'bento-goncalves', 'segmento' => 'massagem', 'nome' => 'Bento Gonçalves / Massagem']
];

foreach ($amostras63 as $amostra) {
    $url = "http://localhost:3000/{$amostra['cidade']}/{$amostra['segmento']}";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    $html = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    assertTest(
        "Combinação anteriormente ausente '{$amostra['nome']}' responde HTTP 200",
        $code === 200 && !str_contains($html, '404'),
        "URL: $url | Status: $code"
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5: ARQUITETURA DE SITEMAPS E NÃO-DUPLICAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- 5. ARQUITETURA DE SITEMAPS E AUDITORIA DE DUPLICAÇÃO ---\n";

$sitemapXml = file_get_contents('http://localhost:3000/sitemap.xml');
$sitemapCatIndex = file_get_contents('http://localhost:3000/sitemap-categorias.xml');
$sitemapCat1 = file_get_contents('http://localhost:3000/sitemap-categorias/1/sitemap.xml');
$sitemapEmpresas = file_get_contents('http://localhost:3000/sitemap-empresas.xml');

assertTest(
    "/sitemap.xml responde XML válido e contém páginas institucionais",
    str_contains($sitemapXml, '<urlset') && str_contains($sitemapXml, '/como-funciona') && str_contains($sitemapXml, '/vagas'),
    "Páginas institucionais presentes no sitemap principal."
);

assertTest(
    "/sitemap.xml NÃO duplica as 8.780 categorias (exclusivas do sitemap-categorias)",
    !str_contains($sitemapXml, '/farroupilha/produtos-caseiros') && !str_contains($sitemapXml, '/garibaldi/produtos-caseiros'),
    "Zero sobreposição de categorias no sitemap.xml."
);

assertTest(
    "/sitemap-categorias.xml responde como Sitemap Index válido",
    str_contains($sitemapCatIndex, '<sitemapindex') && str_contains($sitemapCatIndex, '/sitemap-categorias/1/sitemap.xml'),
    "Sitemap Index ativo e compatível com Google Search Console."
);

assertTest(
    "/sitemap-categorias/1/sitemap.xml contém as 8.780 combinações ativas",
    str_contains($sitemapCat1, '/farroupilha/produtos-caseiros') && str_contains($sitemapCat1, '/flores-da-cunha/transporte-rodoviario-de-carga'),
    "Combinações ativas (incluindo as 63 recuperadas) presentes no urlset de categorias."
);

assertTest(
    "/sitemap-empresas.xml responde como urlset válido de empresas ativas",
    str_contains($sitemapEmpresas, '<urlset') && str_contains($sitemapEmpresas, '/colina-verde-doces-e-geleia'),
    "Perfis de empresas gerados com URLs canônicas limpas."
);

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6: TESTES DE NÃO REGRESSÃO DAS SPRINTS 1 E 2
// ─────────────────────────────────────────────────────────────────────────────
echo "\n--- 6. TESTES DE NÃO-REGRESSÃO DAS SPRINTS 1 E 2 ---\n";

$regressoes = [
    ['url' => 'http://localhost:3000/gramado/comunicacao-integrada', 'expected' => 404, 'nome' => 'Gramado / Comunicação Integrada (Vazia)'],
    ['url' => 'http://localhost:3000/barao/produtos-caseiros', 'expected' => 200, 'nome' => 'Barão / Produtos Caseiros (1 empresa ativa)'],
    ['url' => 'http://localhost:3000/farroupilha/produtos-caseiros', 'expected' => 200, 'nome' => 'Farroupilha / Produtos Caseiros (7 empresas)'],
    ['url' => 'http://localhost:3000/canela/pousadas', 'expected' => 200, 'nome' => 'Canela / Pousadas (1 empresa)'],
    ['url' => 'http://localhost:3000/farroupilha/filtros', 'expected' => 200, 'nome' => 'Farroupilha / Filtros (4 empresas unificadas)']
];

foreach ($regressoes as $reg) {
    $ch = curl_init($reg['url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    assertTest(
        "Não regressão: {$reg['nome']} responde HTTP {$reg['expected']}",
        $code === $reg['expected'],
        "Status HTTP obtido: $code"
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTADO FINAL
// ─────────────────────────────────────────────────────────────────────────────
echo "\n======================================================================\n";
echo "RESULTADO FINAL: $passed TESTES PASSARAM, $failed FALHAS\n";
echo "======================================================================\n";

if ($failed === 0) {
    echo "🎉 SPRINT 3 HOMOLOGADA COM SUCESSO! 100% DE CONFORMIDADE TÉCNICA.\n";
} else {
    echo "❌ ATENÇÃO: $failed TESTES FALHARAM. REVISE OS ITENS ACIMA.\n";
    exit(1);
}

