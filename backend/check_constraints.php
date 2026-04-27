<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$res = DB::select("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'clientes'::regclass");
foreach ($res as $row) {
    echo "Constraint: " . $row->conname . "\n";
    echo "Definition: " . $row->pg_get_constraintdef . "\n\n";
}
