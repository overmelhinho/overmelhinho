<?php

$ch = curl_init('https://www.overmelhinho.com.br/gramado/comunicacao-integrada');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP CODE: $httpCode\n";
echo "HEADERS & BODY PREVIEW:\n";
echo substr($res, 0, 1500) . "\n";

