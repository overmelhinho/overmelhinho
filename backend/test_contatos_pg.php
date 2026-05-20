<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \Illuminate\Support\Facades\DB::connection('pgsql')->table('contatos')->where('cliente_id', 106572)->first();
print_r([
    'whatsapp_selected' => $c->whatsapp_selected,
    'has_whatsapp_principal' => $c->has_whatsapp_principal,
    'has_whatsapp_secundario' => $c->has_whatsapp_secundario,
    'has_whatsapp_celular' => $c->has_whatsapp_celular,
    'has_whatsapp_outro' => $c->has_whatsapp_outro,
]);
