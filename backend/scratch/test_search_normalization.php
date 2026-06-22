<?php
require __DIR__ . '/../vendor/autoload.php';
use Illuminate\Support\Str;

$typos = [
    'o vemrelihnho',
    'vemrelihnho',
    'vermelinho',
    'vermeliho',
    'vemlinho',
    'vermeline',
    'vermelhinho',
    'o vermelhinho de farroupilha',
    'supermercado',
    'velhinho',
    'conselheiro',
    'vermelhao',
    'vermelha',
];

function normalizeQuery($q) {
    if ($q !== '') {
        $words = explode(' ', $q);
        $modified = false;
        foreach ($words as &$word) {
            $cleanWord = strtolower(Str::ascii($word));
            $cleanWord = preg_replace('/[^a-z]/', '', $cleanWord);
            if (strlen($cleanWord) >= 6) {
                if (in_array($cleanWord, ['vermelho', 'vermelha', 'vermelhao', 'vermelhas', 'vermelhos'])) {
                    continue;
                }
                $dist = levenshtein($cleanWord, 'vermelhinho');
                if ($dist <= 4) {
                    $startsWithVOrW = in_array($cleanWord[0], ['v', 'w']);
                    $containsMAndL = strpos($cleanWord, 'm') !== false && strpos($cleanWord, 'l') !== false;
                    if ($startsWithVOrW && $containsMAndL) {
                        // Keep original word structure if it has prefix/suffix, but replace the main part
                        $word = str_replace($cleanWord, 'vermelhinho', strtolower($word));
                        $modified = true;
                    }
                }
            }
        }
        if ($modified) {
            $q = implode(' ', $words);
        }
    }
    return $q;
}

foreach ($typos as $t) {
    $normalized = normalizeQuery($t);
    echo "Original: '$t' => Normalized: '$normalized'\n";
}
