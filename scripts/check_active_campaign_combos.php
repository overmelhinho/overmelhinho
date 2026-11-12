<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$activeCamps = DB::table('campanhas as c')
    ->leftJoin('campanha_cidades as cc', 'c.id', '=', 'cc.campanha_id')
    ->leftJoin('cidades as cid', 'cc.cidade_id', '=', 'cid.id')
    ->leftJoin('campanha_segmentos as cs', 'c.id', '=', 'cs.campanha_id')
    ->leftJoin('segmentos as seg', 'cs.segmento_id', '=', 'seg.id')
    ->where('c.status', 'ativa')
    ->select('c.id', 'c.nome', 'cid.id as cidade_id', 'cid.nome as cidade_nome', 'seg.id as segmento_id', 'seg.nome as segmento_nome')
    ->get();

echo "Campanhas ativas e seus vínculos de cidade e segmento:\n";
$combosWithAds = [];
foreach ($activeCamps as $ac) {
    if ($ac->cidade_id && $ac->segmento_id) {
        $combosWithAds["{$ac->cidade_id}_{$ac->segmento_id}"] = [
            'cidade' => $ac->cidade_nome,
            'segmento' => $ac->segmento_nome,
            'campanha' => $ac->nome
        ];
    }
}

echo "Total de combinações cidade x categoria com anúncios diretos: " . count($combosWithAds) . "\n";
foreach ($combosWithAds as $key => $info) {
    // Verifica se essa combinação tem empresas ativas
    list($cid, $sid) = explode('_', $key);
    $companyCount = DB::table('clientes as c')
        ->join('cliente_cidade as cc', 'c.id', '=', 'cc.cliente_id')
        ->join('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
        ->where('c.exibir_no_site', 'true')
        ->where('cc.cidade_id', $cid)
        ->where('cs.segmento_id', $sid)
        ->count();
    echo " - {$info['cidade']} / {$info['segmento']}: {$companyCount} empresas (Campanha: {$info['campanha']})\n";
}

