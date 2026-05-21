<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = ['clientes', 'enderecos', 'contatos', 'cliente_segmento', 'cliente_cidade', 'redes_sociais', 'autorizacoes'];
foreach($tables as $t) {
    $cols = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = '$t' AND is_nullable = 'NO' AND column_default IS NULL");
    foreach($cols as $c) {
        if ($c->column_name !== 'id') {
            echo "$t -> {$c->column_name}\n";
        }
    }
}
