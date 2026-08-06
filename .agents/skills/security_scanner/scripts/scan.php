<?php

if ($argc < 2) {
    echo "🚨 USO: php scan.php <caminho_do_arquivo>\n";
    exit(1);
}

$file = $argv[1];

if (!file_exists($file)) {
    echo "🚨 ERRO: Arquivo não encontrado: $file\n";
    exit(1);
}

$ext = pathinfo($file, PATHINFO_EXTENSION);
$alerts = [];

echo "🔍 Iniciando SAST & Secret Scan em: $file...\n\n";

// 1. PHP Syntax Check (SAST Básico)
if ($ext === 'php') {
    exec("C:\\xampp2\\php\\php.exe -l \"$file\"", $output, $returnVar);
    if ($returnVar !== 0) {
        $alerts[] = "Erro de Sintaxe PHP:\n" . implode("\n", $output);
    }
}

// 2. Secret Scanning (Procura por padrões hardcoded)
$content = file_get_contents($file);
$lines = explode("\n", $content);

// Padrões perigosos (chaves de api, senhas hardcoded)
$patterns = [
    '/(api_?key|secret|password|token)\s*(=|=>|:)\s*[\'"][a-zA-Z0-9_\-]{8,}[\'"]/i' => 'Possível Secret/Chave de API hardcoded',
    '/supabase_key\s*(=|=>|:)\s*[\'"][a-zA-Z0-9_\-\.]+[\'"]/i' => 'Chave do Supabase exposta',
    '/DB_PASSWORD\s*(=|=>|:)\s*[\'"][^\'"]+[\'"]/i' => 'Senha de Banco de Dados exposta',
    '/DB::raw\([^)]*\$[^)]*\)/i' => 'Possível SQL Injection via raw query com variável',
    '/dangerouslySetInnerHTML/i' => 'Possível Cross-Site Scripting (XSS) no React'
];

foreach ($lines as $lineNum => $line) {
    // Ignorar linhas de comentários
    if (preg_match('/^(\s*\/\/|\s*\*|\s*#)/', $line)) {
        continue;
    }

    foreach ($patterns as $regex => $reason) {
        if (preg_match($regex, $line)) {
            $alerts[] = "[$reason] na linha " . ($lineNum + 1) . ":\n  " . trim($line);
        }
    }
}

// 3. Resultado
if (empty($alerts)) {
    echo "✅ SCAN LIMPO. Nenhum segredo ou erro sintático detectado.\n";
    exit(0);
} else {
    echo "🚨 ALERTA DE SEGURANÇA! Corrija os seguintes problemas antes de prosseguir:\n\n";
    foreach ($alerts as $alert) {
        echo "- $alert\n";
    }
    exit(1);
}
