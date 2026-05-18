<?php
use App\Models\Cliente;
use App\Models\RedeSocial;
use Illuminate\Support\Facades\DB;

echo "Migrando Redes Sociais para clientes já existentes...\n";

$total = Cliente::count();
echo "Total de clientes no banco novo: $total\n";

$count = 0;
Cliente::chunk(500, function ($clientes) use (&$count) {
    $ids = $clientes->pluck('id')->toArray();
    
    $legacyData = DB::connection('legacy')->table('clientes')
        ->whereIn('id', $ids)
        ->select('id', 'pj_facebook', 'pj_instagram', 'pj_youtube', 'pj_linkedin', 'pj_tiktok', 'pj_twitter')
        ->get()
        ->keyBy('id');

    foreach ($clientes as $cliente) {
        $lc = $legacyData->get($cliente->id);
        if (!$lc) continue;

        $socialPlatforms = [
            'facebook' => $lc->pj_facebook,
            'instagram' => $lc->pj_instagram,
            'youtube' => $lc->pj_youtube,
            'linkedin' => $lc->pj_linkedin,
            'tiktok' => $lc->pj_tiktok,
            'twitter' => $lc->pj_twitter,
        ];

        foreach ($socialPlatforms as $type => $url) {
            if (!empty($url) && !in_array(strtolower($url), ['não informado', '---', 'nao informado'])) {
                RedeSocial::updateOrCreate(
                    ['cliente_id' => $cliente->id, 'tipo' => $type],
                    ['url' => $url]
                );
            }
        }
    }
    $count += count($ids);
    echo "Processados: $count / ...\n";
});

echo "Finalizado!\n";
