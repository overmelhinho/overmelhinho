<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \Illuminate\Support\Facades\DB::connection('legacy')->table('clientes')->where('id', 106572)->first();
print_r([
    'fone_principal_possui_whatsapp' => $c->fone_principal_possui_whatsapp,
    'fone_secundario_possui_whatsapp' => $c->fone_secundario_possui_whatsapp,
    'celular_possui_whatsapp' => $c->celular_possui_whatsapp,
    'fax_possui_whatsapp' => $c->fax_possui_whatsapp ?? 'null'
]);
