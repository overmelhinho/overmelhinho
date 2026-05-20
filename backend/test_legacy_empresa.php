<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$legacy = DB::connection('mysql')->table('empresas')->where('id', 22763)->first();
if ($legacy) {
    dump([
        'id' => $legacy->id,
        'pj_nome_fantasia' => $legacy->pj_nome_fantasia,
        'id_categoria' => $legacy->id_categoria ?? 'NOT_EXISTS',
        'id_segmento' => $legacy->id_segmento ?? 'NOT_EXISTS',
        'categoria_id' => $legacy->categoria_id ?? 'NOT_EXISTS',
        'segmento_id' => $legacy->segmento_id ?? 'NOT_EXISTS',
    ]);
} else {
    $legacy = DB::connection('mysql')->table('empresas')->where('pj_nome_fantasia', 'like', '%Bento%')->limit(1)->first();
    dump($legacy);
}
