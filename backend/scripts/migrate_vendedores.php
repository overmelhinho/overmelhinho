<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Autorizacao;
use App\Models\User;

$legacyDb = DB::connection('legacy');

// New User IDs
// 1 = Edu, 22 = Angélica de Luca, 26 = Nádia, 27 = Amanda, 28 = Laura, 29 = Juliana

$legacyUserMap = [
    5 => 1, // Gabrieli Brollo -> ? Let's ignore unknown for now or map to Edu/null
    7 => 1, // João -> ?
    8 => 26, // Nadia Zago
    16 => 22, // Angélica De Luca
    100 => 22, // Angélica
    1717 => 22, // Angélica De Luca - Vendedor
    1782 => 22, // Angélica De Luca
    1788 => 22, // Ange De Luca
    1773 => 28, // Laura
    1774 => 28, // Laura
    1781 => 28, // Laura Sturza
    1766 => 27, // Amanda de Matos Stolarski
    1776 => 29, // Juliana
    // Others can map to null or we can just try to match by first name...
];

echo "Fetching legacy users...\n";
$legacyUsers = $legacyDb->select("SELECT id, nome FROM usuarios");
foreach ($legacyUsers as $lu) {
    $nomeLower = mb_strtolower($lu->nome);
    if (strpos($nomeLower, 'angélica') !== false || strpos($nomeLower, 'angelica') !== false || strpos($nomeLower, 'ange de luca') !== false) {
        $legacyUserMap[$lu->id] = 22;
    } elseif (strpos($nomeLower, 'nadia') !== false || strpos($nomeLower, 'nádia') !== false) {
        $legacyUserMap[$lu->id] = 26;
    } elseif (strpos($nomeLower, 'amanda') !== false) {
        $legacyUserMap[$lu->id] = 27;
    } elseif (strpos($nomeLower, 'laura') !== false) {
        $legacyUserMap[$lu->id] = 28;
    } elseif (strpos($nomeLower, 'juliana') !== false) {
        $legacyUserMap[$lu->id] = 29;
    } elseif (strpos($nomeLower, 'eduardo') !== false || strpos($nomeLower, 'edu') !== false) {
        $legacyUserMap[$lu->id] = 1;
    }
}

echo "Fetching legacy publicidades...\n";
$legacyPubs = $legacyDb->select("SELECT id_vendedor, num_autorizacao FROM publicidades WHERE num_autorizacao != '' AND num_autorizacao IS NOT NULL");
$pubMap = [];
foreach ($legacyPubs as $pub) {
    $pubMap[$pub->num_autorizacao] = $pub->id_vendedor;
}

echo "Fetching autorizacoes to update...\n";
$auths = Autorizacao::whereNull('vendedor_id')->get();
$updated = 0;
$notFound = 0;

echo "Found " . $auths->count() . " autorizacoes with missing vendedor_id.\n";

$bulkUpdates = [];

foreach ($auths as $auth) {
    $legacyVendedorId = $pubMap[$auth->numero] ?? null;
    
    if ($legacyVendedorId) {
        $newVendorId = $legacyUserMap[$legacyVendedorId] ?? null;
        if ($newVendorId) {
            $bulkUpdates[$newVendorId][] = $auth->id;
            $updated++;
        } else {
            $notFound++;
        }
    }
}

echo "Running bulk updates...\n";
foreach ($bulkUpdates as $vendorId => $authIds) {
    DB::table('autorizacoes')->whereIn('id', $authIds)->update(['vendedor_id' => $vendorId]);
}

echo "Updated: $updated\n";
echo "Vendors not found in new DB: $notFound\n";

