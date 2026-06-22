<?php
$html = file_get_contents('https://overmelhinho.com.br/rs/farroupilha/o-botic-rio/21232');
preg_match_all('/(?:src|href)=["\']([^"\']+?\.(?:jpg|png|jpeg|webp))["\']/', $html, $matches);
$urls = array_unique($matches[1]);
foreach($urls as $url) {
    echo $url . "\n";
}
