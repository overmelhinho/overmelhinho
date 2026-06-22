<?php
$logFile = __DIR__ . '/storage/logs/laravel.log';
if (!file_exists($logFile)) {
    die("Log file not found.\n");
}

$handle = fopen($logFile, 'r');
$matches = [];
$lineNumber = 0;
while (($line = fgets($handle)) !== false) {
    $lineNumber++;
    // Check if line is from today and has client or auth identifiers
    if (strpos($line, '2026-06-08') !== false) {
        if (strpos($line, '106572') !== false || strpos($line, '25918') !== false || strpos($line, '41310') !== false || strpos($line, '6666') !== false) {
            $matches[] = "Line $lineNumber: $line";
        }
    }
}
fclose($handle);

echo "Found " . count($matches) . " matches:\n";
foreach ($matches as $m) {
    echo $m;
}
