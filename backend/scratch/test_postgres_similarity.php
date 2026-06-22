<?php  
// Let's run a test query using Laravel's Artisan or custom bootstrap to test similarity.
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$q1 = 'vemrelihnho';
$q2 = 'o vemrelihnho';
$candidates = ['vermelhinho', 'o vermelhinho', 'O Vermelhinho - Site de Publicidade'];

foreach ($candidates as $candidate) {
    $similarity = DB::select("SELECT similarity(?, ?) as sim", [$q1, $candidate])[0]->sim;
    $word_similarity = DB::select("SELECT word_similarity(?, ?) as sim", [$q1, $candidate])[0]->sim;
    echo "Query: '$q1' vs Candidate: '$candidate'\n";
    echo "  similarity: $similarity\n";
    echo "  word_similarity: $word_similarity\n\n";
}

foreach ($candidates as $candidate) {
    $similarity = DB::select("SELECT similarity(?, ?) as sim", [$q2, $candidate])[0]->sim;
    $word_similarity = DB::select("SELECT word_similarity(?, ?) as sim", [$q2, $candidate])[0]->sim;
    echo "Query: '$q2' vs Candidate: '$candidate'\n";
    echo "  similarity: $similarity\n";
    echo "  word_similarity: $word_similarity\n\n";
}
