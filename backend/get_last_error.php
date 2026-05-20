<?php
$lines = file('storage/logs/laravel.log');
$errors = [];
foreach($lines as $line) {
    if (strpos($line, 'local.ERROR') !== false) {
        $errors[] = $line;
    }
}
echo array_pop($errors);
