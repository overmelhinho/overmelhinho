<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $service = app(\App\Services\Ga4ReportingService::class);
    $res = $service->getRealtimeMetrics();
    print_r($res);
} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
}
