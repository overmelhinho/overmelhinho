<?php

$urls = [
    'https://www.overmelhinho.com.br/gramado/comunicacao-integrada',
    'https://www.overmelhinho.com.br/barao/produtos-caseiros',
    'https://www.overmelhinho.com.br/farroupilha/produtos-caseiros',
    'https://www.overmelhinho.com.br/canela/pousadas',
    'https://www.overmelhinho.com.br/farroupilha/filtros',
    'https://www.overmelhinho.com.br/sitemap-categorias.xml'
];

foreach ($urls as $url) {
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
    if (str_contains($url, 'gramado')) {
        echo "   Contem '404' ou 'notFound'? " . (str_contains($res, '404') || str_contains($res, 'Página não encontrada') ? 'SIM' : 'NÃO') . "\n";
    }
}

