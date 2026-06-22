<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$triggers = \DB::select("SELECT tgname, tgtype, relname 
                         FROM pg_trigger 
                         JOIN pg_class ON pg_class.oid = tgrelid 
                         WHERE relname IN ('autorizacoes', 'autorizacao_parcelas', 'invoices')");
echo "Found Triggers:\n";
print_r($triggers);
