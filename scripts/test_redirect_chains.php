<?php

$domains = [
    'http://overmelhinho.com.br',
    'http://www.overmelhinho.com.br',
    'https://overmelhinho.com.br',
    'https://www.overmelhinho.com.br',
    'http://overmelhinho.com.br/busca.php?palavra=restaurante',
    'https://overmelhinho.com.br/busca.php?palavra=restaurante',
    'https://www.overmelhinho.com.br/busca.php?palavra=restaurante',
    'https://www.overmelhinho.com.br/busca.php?id_cidade=64&id_categoria=899',
    'https://www.overmelhinho.com.br/-comunicacao-integrada-;cat899.php',
    'https://www.overmelhinho.com.br/rs/caxias-do-sul/empresa/107316',
    'https://www.overmelhinho.com.br/pr/curitiba/empresa/107316',
    'https://www.overmelhinho.com.br/cliente/107316',
    'https://www.overmelhinho.com.br/teste-slug;contato:id107316.php',
];

foreach ($domains as $url) {
    echo "========================================\n";
    echo "TESTING: $url\n";
    $current = $url;
    $hops = 0;
    while ($hops < 6) {
        $ch = curl_init($current);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $redirectUrl = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
        curl_close($ch);
        
        echo "  Hop $hops: HTTP $code";
        if ($redirectUrl) {
            echo " -> Location: $redirectUrl\n";
            $current = $redirectUrl;
            $hops++;
        } else {
            echo " (Final Destination: $current)\n";
            break;
        }
    }
}

