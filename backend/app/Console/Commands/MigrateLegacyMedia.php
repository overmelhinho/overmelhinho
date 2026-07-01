<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MigrateLegacyMedia extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'legacy:migrate-media {--client= : Executa apenas para um ID de cliente específico}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrates logos and gallery images from the legacy server to local storage.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $clientId = $this->option('client');
        
        $this->info("====================================");
        $this->info(" MIGRANDO MÍDIAS DO SISTEMA LEGADO  ");
        if ($clientId) {
            $this->info(" MODO DE TESTE: APENAS CLIENTE {$clientId} ");
        }
        $this->info("====================================");

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

        $this->info("-> Buscando Logos no legado...");
        $logosQuery = $legacyConn->table('clientes')->whereNotNull('pj_logotipo')->where('pj_logotipo', '!=', '');
        if ($clientId) {
            $logosQuery->where('id', $clientId);
        }
        $clientesComLogo = $logosQuery->get(['id', 'pj_logotipo', 'pj_nome_fantasia']);

        $migrados_logo = 0;
        foreach ($clientesComLogo as $legacyClient) {
            $clienteLocal = Cliente::where('id', $legacyClient->id)->first();

            if ($clienteLocal && empty($clienteLocal->logo_url)) {
                $urlLogo = "http://31.97.27.242/assets/logos/" . $legacyClient->pj_logotipo;
                $fallbackUrl = "http://31.97.27.242/arquivos/" . $legacyClient->pj_logotipo;

                $imageContent = @file_get_contents($urlLogo);
                if ($imageContent === false) {
                    $imageContent = @file_get_contents($fallbackUrl);
                }

                if ($imageContent !== false) {
                    $fileName = time() . '_' . basename($legacyClient->pj_logotipo);
                    Storage::disk('public')->put('logos/' . $fileName, $imageContent);
                    
                    $clienteLocal->logo_url = 'logos/' . $fileName;
                    $clienteLocal->timestamps = false;
                    $clienteLocal->save();
                    
                    $this->line("  [LOGOS] Baixado para cliente {$clienteLocal->id} - {$clienteLocal->nome_fantasia}");
                    $migrados_logo++;
                }
            }
        }
        $this->info("Total de Logos importadas: {$migrados_logo}\n");

        $this->info("-> Buscando Galerias de Imagens...");
        $galeriasQuery = $legacyConn->table('clientes_imagens');
        if ($clientId) {
            $galeriasQuery->where('id_cliente', $clientId);
        }
        $todasImagensLegado = $galeriasQuery->get();

        $migradas_galeria = 0;
        foreach ($todasImagensLegado as $img) {
            // Pode estar salvo como `localhost:8000/storage/...` no banco local, procuramos com LIKE
            $imagemLocal = DB::table('galerias_imagens')
                ->where('cliente_id', $img->id_cliente)
                ->where('url', 'LIKE', '%' . $img->imagem . '%')
                ->first();

            if ($imagemLocal) {
                $filePath = "midias/" . $img->imagem;
                if (!Storage::disk('public')->exists($filePath)) {
                    $urlImg = "http://31.97.27.242/arquivos/" . $img->imagem;
                    $imageContent = @file_get_contents($urlImg);
                    
                    if ($imageContent !== false) {
                        Storage::disk('public')->put($filePath, $imageContent);
                        DB::table('galerias_imagens')->where('id', $imagemLocal->id)->update([
                            'url' => $filePath
                        ]);
                        $this->line("  [GALERIA] Baixada foto para cliente {$img->id_cliente}: {$img->imagem}");
                        $migradas_galeria++;
                    }
                }
            } else {
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
                            $this->line("  [GALERIA] Criada foto para cliente {$img->id_cliente}: {$img->imagem}");
                            $migradas_galeria++;
                        }
                    }
                }
            }
        }
        $this->info("Total de Fotos de Galeria importadas: {$migradas_galeria}\n");
        $this->info("MIGRAÇÃO CONCLUÍDA!");
    }
}
