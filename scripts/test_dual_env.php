<?php

echo "=== TESTE LOCAL (Next.js Build da Sprint 2 no localhost:3000) ===\n";
$localUrls = [
    'http://localhost:3000/gramado/comunicacao-integrada',
    'http://localhost:3000/barao/produtos-caseiros',
    'http://localhost:3000/farroupilha/produtos-caseiros',
    'http://localhost:3000/canela/pousadas',
    'http://localhost:3000/farroupilha/filtros',
    'http://localhost:3000/sitemap-categorias.xml'
];

foreach ($localUrls as $url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    $t0 = microtime(true);
    $res = curl_exec($ch);
    $ms = round((microtime(true) - $t0) * 1000);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $len = strlen($res);
    curl_close($ch);
    echo "$url -> HTTP $code ({$ms}ms, size: $len bytes)\n";
}

echo "\n=== TESTE EM PRODUÇÃO (overmelhinho.com.br) ===\n";
$prodUrls = [
    'https://www.overmelhinho.com.br/gramado/comunicacao-integrada',
    'https://www.overmelhinho.com.br/barao/produtos-caseiros',
    'https://www.overmelhinho.com.br/farroupilha/produtos-caseiros',
    'https://www.overmelhinho.com.br/canela/pousadas',
    'https://www.overmelhinho.com.br/farroupilha/filtros',
    'https://www.overmelhinho.com.br/sitemap-categorias.xml'
];

foreach ($prodUrls as $url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_USERAGENT, 'AuditBot/1.0');
    $t0 = microtime(true);
    $res = curl_exec($ch);
    $ms = round((microtime(true) - $t0) * 1000);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $len = strlen($res);
    curl_close($ch);
    echo "$url -> HTTP $code ({$ms}ms, size: $len bytes)\n";
}

