<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$q = 'psicologia';
$normalizedQ = \Illuminate\Support\Str::ascii($q);
$isSegmentSearch = \App\Models\Segmento::whereRaw('unaccent(nome) ilike unaccent(?)', [$normalizedQ])->exists();

echo "Is segment search? " . ($isSegmentSearch ? 'Yes' : 'No') . "\n";
