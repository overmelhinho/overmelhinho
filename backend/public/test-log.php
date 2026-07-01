<?php
$logFile = __DIR__ . '/../storage/logs/laravel.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -200);
    header('Content-Type: text/plain; charset=utf-8');
    foreach ($lastLines as $line) {
        echo $line;
    }
} else {
    echo "Log file not found at $logFile";
}
