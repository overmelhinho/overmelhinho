<?php
$file = new SplFileObject(__DIR__ . '/../storage/logs/laravel.log');
$file->seek(PHP_INT_MAX);
$total = $file->key();
echo "Total lines: $total\n";
$start = max(0, $total - 50);
$file->seek($start);
for ($i = $start; $i <= $total; $i++) {
    echo "$i: " . $file->current();
    $file->next();
}
