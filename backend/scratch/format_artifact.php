<?php
$data = json_decode(file_get_contents(__DIR__ . '/check_clients_output_utf8.json'), true);

$md = "# Clientes Encontrados (" . count($data) . ")\n\n";
foreach($data as $c) {
    $md .= "- " . $c['nome_fantasia'] . " (Status: " . $c['status_assinatura'] . ")\n";
}

file_put_contents('C:\Users\Windows\.gemini\antigravity\brain\f755b6a1-7e5c-4cb1-b1c7-58a89a03f262\clientes_verificados.md', $md);
echo "Done";
