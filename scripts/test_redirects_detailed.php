<?php

echo "======================================================================\n";
echo "              VALIDAÇÃO DETALHADA DE REDIRECIONAMENTOS                \n";
echo "======================================================================\n\n";

function testRedirect($label, $url, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_HEADER, true);
    if (!empty($headers)) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $loc = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
    curl_close($ch);
    echo "[$code] $label\n";
    echo "       URL: $url\n";
    echo "       Location: " . ($loc ?: '(nenhum)') . "\n\n";
    return ['code' => $code, 'loc' => $loc];
}

// 1. Host canônico sem WWW
testRedirect(
    "Host sem WWW com parâmetros complexos",
    "http://localhost:3000/farroupilha/produtos-caseiros?origem=gsearch&ref=123",
    ['Host: overmelhinho.com.br']
);

// 2. Host com WWW (não deve redirecionar - prevenção de loop)
testRedirect(
    "Host com WWW (permanece 200, sem loop)",
    "http://localhost:3000/farroupilha/produtos-caseiros?origem=teste",
    ['Host: www.overmelhinho.com.br']
);

// 3. Busca legada com cidade e categoria
testRedirect(
    "Busca legada cidade=1 (Farroupilha) e cat=846 (Advocacia)",
    "http://localhost:3000/busca.php?id_cidade=1&id_categoria=846"
);

// 4. Busca legada textual
testRedirect(
    "Busca legada com termo textual",
    "http://localhost:3000/busca.php?palavra=pizzaria"
);

// 5. Categoria legada antiga .php
testRedirect(
    "Categoria legada antiga .php (/-advocacia-;cat846.php)",
    "http://localhost:3000/-advocacia-;cat846.php"
);

// 6. Rota histórica de contato de empresa
testRedirect(
    "Contato legado (;contato:id.php)",
    "http://localhost:3000/tessmer-corretora;contato107385.php"
);

// 7. Rota histórica multi-estado (ex: PR)
testRedirect(
    "Empresa legada outro estado (/pr/curitiba/empresa/12345)",
    "http://localhost:3000/pr/curitiba/empresa/12345"
);

