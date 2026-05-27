<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$auth = \App\Models\Autorizacao::where('numero', '25912')->first();
if ($auth) {
    $auth->update(['status' => 'assinado']);
    \App\Models\Invoice::where('group_id', 'autorizacao-' . $auth->id)->update(['status' => 'pending']);
    echo "Restaurado!";
}
