<?php
$logPath = __DIR__.'/storage/logs/laravel.log';
if (!file_exists($logPath)) {
    echo "Log not found\n";
    exit;
}

$file = file($logPath);
$lines = array_slice($file, -20000);

$found = false;
foreach ($lines as $line) {
    if (stripos($line, '25912') !== false || stripos($line, 'Erro na automação') !== false || stripos($line, '41295') !== false) {
        echo $line;
        $found = true;
    }
}

if (!$found) echo "Nada encontrado\n";
