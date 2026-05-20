<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Candidate;
use Illuminate\Support\Facades\DB;

$c = Candidate::where('email', 'francielemarciano1@gmail.com')->get();
echo "Total duplicates: " . $c->count() . "\n";
if ($c->count() > 0) {
    echo "First created_at: " . $c->first()->created_at . "\n";
    echo "Last created_at: " . $c->last()->created_at . "\n";
}
