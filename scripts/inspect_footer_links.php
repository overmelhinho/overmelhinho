<?php

$urls = [
    'https://www.overmelhinho.com.br/blog',
    'https://www.overmelhinho.com.br/farroupilha/saude',
    'https://www.overmelhinho.com.br/caxias-do-sul/servicos',
    'https://www.overmelhinho.com.br/bento-goncalves/gastronomia',
];

foreach ($urls as $u) {
    $ch = curl_init($u);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $loc = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
    curl_close($ch);
    echo "$u -> HTTP $code" . ($loc ? " -> Location: $loc" : "") . "\n";
}

