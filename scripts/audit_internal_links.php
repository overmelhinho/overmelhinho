<?php

$dir = new RecursiveDirectoryIterator('c:/Dev/overmelhinho/site/src');
$ite = new RecursiveIteratorIterator($dir);
$files = new RegexIterator($ite, '/\.tsx?$/');

$links = [];

foreach ($files as $file) {
    $content = file_get_contents($file->getPathname());
    $relPath = str_replace('c:/Dev/overmelhinho/', '', str_replace('\\', '/', $file->getPathname()));
    
    // Procura href="..." e href={...} e router.push(...)
    if (preg_match_all('/(?:href=["\']([^"\']+)["\']|href=\{[`"\']([^`"\']+)[`"\']\}|router\.push\(["\']([^"\']+)["\']\))/i', $content, $m)) {
        for ($i = 0; $i < count($m[0]); $i++) {
            $link = $m[1][$i] ?: $m[2][$i] ?: $m[3][$i];
            if ($link && !str_starts_with($link, 'http') && !str_starts_with($link, '#') && !str_starts_with($link, 'mailto') && !str_starts_with($link, 'tel')) {
                $links[] = [
                    'file' => $relPath,
                    'link' => $link
                ];
            }
        }
    }
}

// Agrupar por link estático
$uniqueLinks = [];
foreach ($links as $item) {
    $l = $item['link'];
    $uniqueLinks[$l][] = $item['file'];
}

ksort($uniqueLinks);
foreach ($uniqueLinks as $l => $occurrences) {
    echo "$l  --> " . count($occurrences) . " ocorrencia(s) em: " . implode(', ', array_unique($occurrences)) . "\n";
}

