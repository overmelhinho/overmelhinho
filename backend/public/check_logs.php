<?php
header('Content-Type: text/plain');
$logFile = __DIR__ . '/../storage/logs/laravel.log';
if (file_exists($logFile)) {
    // Return last 200 lines
    exec("tail -n 200 " . escapeshellarg($logFile), $output);
    echo implode("\n", $output);
} else {
    echo "Log file not found at: $logFile";
}
echo "\n\n--- DEPLOY LOG ---\n";
$deployLog = '/var/www/deploy.log';
if (file_exists($deployLog)) {
    exec("tail -n 100 " . escapeshellarg($deployLog), $output2);
    echo implode("\n", $output2);
} else {
    echo "Deploy log not found at: $deployLog";
}
