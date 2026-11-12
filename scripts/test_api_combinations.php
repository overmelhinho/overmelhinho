<?php

$res = file_get_contents('http://127.0.0.1:8000/api/v1/public/active-sitemap-combinations');
$data = json_decode($res, true);
echo "API retornou " . count($data['data']) . " combinacoes!\n";

$samples = ['Flores da Cunha', 'Caxias do Sul', 'Farroupilha', 'Bento Gonçalves'];
$found = 0;
foreach ($data['data'] as $combo) {
    if (in_array($combo['city_name'], $samples)) {
        if (++$found <= 5) {
            echo "  - {$combo['city_name']} / {$combo['segment_name']}\n";
        }
    }
}

