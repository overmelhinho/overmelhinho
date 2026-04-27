<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Migrando valores via SQL bruto para evitar problemas com AuditLog...\n";

// Preferência
DB::statement("UPDATE clientes SET contact_preference = 'presencial' WHERE contact_preference = 'presential'");
DB::statement("UPDATE clientes SET contact_preference = 'ligacao' WHERE contact_preference = 'call'");

// Turno
DB::statement("UPDATE clientes SET best_contact_shift = 'manha' WHERE best_contact_shift = 'morning'");
DB::statement("UPDATE clientes SET best_contact_shift = 'tarde' WHERE best_contact_shift = 'afternoon'");
DB::statement("UPDATE clientes SET best_contact_shift = 'ambos' WHERE best_contact_shift = 'both'");

echo "Sucesso! Valores normalizados.\n";
