<?php
$stopwords = ['otica'];
$cidade = 'Farroupilha';
$cidadeWords = explode(' ', mb_strtolower(\Illuminate\Support\Str::ascii($cidade)));
$stopwords = array_merge($stopwords, $cidadeWords);

$name = 'Ótica Farroupilha';
$cleanGName = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(\Illuminate\Support\Str::ascii($name)));
$gWordsAll = array_values(array_filter(explode(' ', $cleanGName), fn($w) => strlen($w) > 2));
$gWords = array_values(array_filter($gWordsAll, fn($w) => !in_array($w, $stopwords)));

var_dump($gWordsAll);
var_dump($gWords);
