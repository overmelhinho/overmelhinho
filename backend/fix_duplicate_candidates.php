<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Candidate;
use Illuminate\Support\Facades\DB;

// Encontrar e apagar duplicatas
$duplicates = DB::select("
    SELECT job_opportunity_id, email, MIN(id) as keep_id
    FROM candidates
    GROUP BY job_opportunity_id, email
    HAVING COUNT(id) > 1
");

$removed = 0;
foreach ($duplicates as $dup) {
    $deleted = DB::delete("
        DELETE FROM candidates
        WHERE job_opportunity_id = ? 
          AND email = ? 
          AND id != ?
    ", [$dup->job_opportunity_id, $dup->email, $dup->keep_id]);
    
    $removed += $deleted;
}

echo "Removed $removed duplicate applications.\n";

// Agora, adicionar a constraint única no banco de dados para evitar futuros problemas
try {
    DB::statement('ALTER TABLE candidates ADD CONSTRAINT unique_job_email UNIQUE (job_opportunity_id, email)');
    echo "Unique constraint added successfully.\n";
} catch (\Exception $e) {
    echo "Error adding constraint: " . $e->getMessage() . "\n";
}
