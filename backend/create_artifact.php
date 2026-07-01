<?php
$lines = file('fix-log.txt');
$md = "# Relatório de Endereços Corrigidos\n\nForam corrigidos os endereços vazios que não haviam sido migrados corretamente do banco legado.\n\n";
$md .= "| ID | Cliente | Novo Endereço |\n";
$md .= "|----|---------|---------------|\n";

for ($i = 5; $i < count($lines); $i+=2) {
    if (!isset($lines[$i+1])) break;
    $clientLine = trim($lines[$i]);
    $addressLine = trim($lines[$i+1]);
    
    if (preg_match('/ID (\d+) - (.+)/', $clientLine, $matches)) {
        $id = $matches[1];
        $name = trim($matches[2]);
        $address = trim(str_replace('-> Novo Endereco:', '', $addressLine));
        
        $md .= "| $id | $name | $address |\n";
    }
}

file_put_contents('C:/Users/Windows/.gemini/antigravity-ide/brain/f9386d25-5313-4710-9e73-e504e29ac6e4/relatorio_enderecos.md', $md);
echo "Artifact created.";
