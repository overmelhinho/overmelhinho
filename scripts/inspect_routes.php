<?php

$urls = [
    'https://www.overmelhinho.com.br/farroupilha',
    'https://www.overmelhinho.com.br/caxias-do-sul',
    'https://www.overmelhinho.com.br/bento-goncalves',
    'https://www.overmelhinho.com.br/anuncie',
    'https://www.overmelhinho.com.br/como-funciona',
    'https://www.overmelhinho.com.br/sobre',
    'https://www.overmelhinho.com.br/vagas',
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

