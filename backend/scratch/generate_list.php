<?php
$content = file_get_contents(__DIR__ . '/check_clients_output_utf8.json');
preg_match_all('/"nome_fantasia":\s*"([^"]+)"/', $content, $matches1);
preg_match_all('/"status_assinatura":\s*"([^"]+)"/', $content, $matches2);

$md = "Aqui está a lista dos clientes encontrados que atendem aos requisitos:\n\n";

foreach ($matches1[1] as $index => $name) {
    // Unescape unicode (e.g. \u00e7)
    $name = json_decode('"' . $name . '"');
    $status = isset($matches2[1][$index]) ? $matches2[1][$index] : 'desconhecido';
    $md .= "- **" . $name . "** (Status no BD: " . $status . ")\n";
}

file_put_contents('C:\Users\Windows\.gemini\antigravity\brain\f755b6a1-7e5c-4cb1-b1c7-58a89a03f262\clientes_encontrados.md', $md);
echo "Artifact created!";
