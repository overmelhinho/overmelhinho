<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$inv66662 = \App\Models\Invoice::find(66662);
if ($inv66662) {
    echo "Invoice 66662 found:\n";
    print_r($inv66662->toArray());
} else {
    echo "Invoice 66662 NOT found in database.\n";
    // Let's check the audit log if there is any Audit or Activity log.
    // We saw app/Observers/AuditObserver.php. Let's see if there's an Audit/Logs table.
    try {
        $audit = \DB::table('audit_logs')->where('auditable_id', 66662)->orWhere('description', 'like', '%66662%')->get();
        echo "Audit logs count: " . $audit->count() . "\n";
        foreach($audit as $a) {
            print_r($a);
        }
    } catch (\Exception $e) {
        echo "Audit logs check failed: " . $e->getMessage() . "\n";
    }
}
