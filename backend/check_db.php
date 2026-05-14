<?php
$enderecos = \App\Models\Endereco::whereNotNull('latitude')->count();
echo "Enderecos with coordinates: " . $enderecos . "\n";
