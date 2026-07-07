<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Cliente;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

echo "====================================\n";
echo " MIGRANDO MÍDIAS DO SISTEMA LEGADO  \n";
echo "====================================\n\n";

$legacy_db = [
    'driver'    => 'mysql',
    'host'      => '31.97.27.242',
    'database'  => 'overmelhinho',
    'username'  => 'overmelhinhocom',
    'password'  => 'w$JkD69Vzz6*n5',
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
];

config(['database.connections.legacy' => $legacy_db]);

$legacyConn = DB::connection('legacy');

// Process Logos
echo "-> Buscando Logos no legado...\n";
$clientesComLogo = $legacyConn->table('clientes')->whereNotNull('pj_logotipo')->where('pj_logotipo', '!=', '')->get(['id', 'pj_logotipo', 'pj_nome_fantasia']);

$migrados_logo = 0;
foreach ($clientesComLogo as $legacyClient) {
    // Acha o cliente correspondente no Postgres
    $clienteLocal = Cliente::where('id', $legacyClient->id)->first();

    if ($clienteLocal) {
        if (empty($clienteLocal->logo_url)) {
            $urlLogo = "http://31.97.27.242/assets/logos/" . $legacyClient->pj_logotipo;
            // Algumas vezes a logo pode estar em arquivos/
            $fallbackUrl = "http://31.97.27.242/arquivos/" . $legacyClient->pj_logotipo;

            $imageContent = @file_get_contents($urlLogo);
            if ($imageContent === false) {
                $imageContent = @file_get_contents($fallbackUrl);
            }

            if ($imageContent !== false) {
                // Salvar logo
                $fileName = time() . '_' . basename($legacyClient->pj_logotipo);
                Storage::disk('public')->put('logos/' . $fileName, $imageContent);
                $clienteLocal->logo_url = 'logos/' . $fileName;
                $clienteLocal->save();
                echo "  [LOGOS] Baixado para cliente {$clienteLocal->id} - {$clienteLocal->nome_fantasia}\n";
                $migrados_logo++;
            } else {
                echo "  [ERROR] Logo não acessível: {$urlLogo}\n";
            }
        }
    }
}
echo "Total de Logos importadas: {$migrados_logo}\n\n";

// Process Galerias
echo "-> Buscando Galerias de Imagens...\n";
$todasImagensLegado = $legacyConn->table('clientes_imagens')->get();

$migradas_galeria = 0;
foreach ($todasImagensLegado as $img) {
    // Procurar a imagem na galeria local (pode estar com o localhost gravado)
    $imagemLocal = DB::table('galerias_imagens')
        ->where('cliente_id', $img->id_cliente)
        ->where('url', 'LIKE', '%' . $img->imagem . '%')
        ->first();

    if ($imagemLocal) {
        $filePath = "midias/" . $img->imagem;
        // Se a imagem já foi salva com outro nome (ex: midias/...)
        // Vamos checar se o arquivo fisico existe
        if (!Storage::disk('public')->exists($filePath)) {
            $urlImg = "http://31.97.27.242/arquivos/" . $img->imagem;
            $imageContent = @file_get_contents($urlImg);
            
            if ($imageContent !== false) {
                Storage::disk('public')->put($filePath, $imageContent);
                // Atualiza o registro para incluir a pasta
                DB::table('galerias_imagens')->where('id', $imagemLocal->id)->update([
                    'url' => $filePath
                ]);
                echo "  [GALERIA] Baixada foto para cliente {$img->id_cliente}: {$img->imagem}\n";
                $migradas_galeria++;
            } else {
                 echo "  [ERROR] Foto da galeria não acessível: {$urlImg}\n";
            }
        }
    } else {
         // O cliente pode existir, mas a galeria não foi cadastrada. Vamos tentar criar.
         $clienteLocal = Cliente::where('id', $img->id_cliente)->first();
         if ($clienteLocal) {
              $filePath = "midias/" . $img->imagem;
              if (!Storage::disk('public')->exists($filePath)) {
                  $urlImg = "http://31.97.27.242/arquivos/" . $img->imagem;
                  $imageContent = @file_get_contents($urlImg);
                  if ($imageContent !== false) {
                      Storage::disk('public')->put($filePath, $imageContent);
                      
                      DB::table('galerias_imagens')->insert([
                          'cliente_id' => $img->id_cliente,
                          'url' => $filePath,
                          'created_at' => now()
                      ]);
                      echo "  [GALERIA] Criada foto para cliente {$img->id_cliente}: {$img->imagem}\n";
                      $migradas_galeria++;
                  }
              }
         }
    }
}
echo "Total de Fotos de Galeria importadas: {$migradas_galeria}\n\n";

echo "MIGRAÇÃO CONCLUÍDA!\n";
