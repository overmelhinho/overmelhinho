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
    protected $signature = 'legacy:migrate-media {--client= : Executa apenas para um ID de cliente específico} {--clientes= : Múltiplos IDs separados por vírgula} {--recent-pagantes : Executa para todos os clientes pagantes dos últimos 60 dias} {--only-portfolios : Pula logos e galerias, baixando apenas cardápios e portfólios}';

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
        $clientesStr = $this->option('clientes');
        $recentPagantes = $this->option('recent-pagantes');
        
        $this->info("====================================");
        $this->info(" MIGRANDO MÍDIAS DO SISTEMA LEGADO  ");
        if ($clientId) {
            $this->info(" MODO DE TESTE: APENAS CLIENTE {$clientId} ");
        } elseif ($clientesStr) {
            $this->info(" MODO: MÚLTIPLOS CLIENTES ({$clientesStr}) ");
        } elseif ($recentPagantes) {
            $this->info(" MODO: CLIENTES PAGANTES DOS ÚLTIMOS 60 DIAS ");
        }
        $this->info("====================================");

        $clientIdsToMigrate = [];
        if ($clientesStr) {
            $clientIdsToMigrate = array_filter(array_map('trim', explode(',', $clientesStr)));
            $this->info("Executando para " . count($clientIdsToMigrate) . " clientes específicos.");
        } elseif ($recentPagantes) {
            $clientIdsToMigrate = \App\Models\Autorizacao::where('created_at', '>=', now()->subDays(60))
                ->pluck('cliente_id')
                ->filter()
                ->unique()
                ->toArray();
            $this->info("Encontrados " . count($clientIdsToMigrate) . " clientes recentes para migração.");
            if (empty($clientIdsToMigrate)) {
                $this->info("Nenhum cliente pagante recente encontrado. Encerrando.");
                return;
            }
        }

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

        $onlyPortfolios = $this->option('only-portfolios');

        if (!$onlyPortfolios) {
            $this->info("-> Buscando Logos no legado...");
            $logosQuery = $legacyConn->table('clientes')->whereNotNull('pj_logotipo')->where('pj_logotipo', '!=', '');
            if ($clientId) {
                $logosQuery->where('id', $clientId);
            } elseif (!empty($clientIdsToMigrate)) {
                $logosQuery->whereIn('id', $clientIdsToMigrate);
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
        } elseif (!empty($clientIdsToMigrate)) {
            $galeriasQuery->whereIn('id_cliente', $clientIdsToMigrate);
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
            $this->info("Total de Fotos de Galeria importadas: {$migradas_galeria}\n");
        }

        $this->info("-> Buscando Cardápios/Portfólios no legado...");
        $cardapiosQuery = $legacyConn->table('clientes')->whereNotNull('cardapio')->where('cardapio', '!=', '');
        if ($clientId) {
            $cardapiosQuery->where('id', $clientId);
        } elseif (!empty($clientIdsToMigrate)) {
            $cardapiosQuery->whereIn('id', $clientIdsToMigrate);
        }
        $clientesComCardapio = $cardapiosQuery->get(['id', 'pj_nome_fantasia', 'cardapio', 'visualiza_cardapio', 'visualiza_catalogo']);

        $migrados_cardapio = 0;
        foreach ($clientesComCardapio as $legacyClient) {
            $clienteLocal = Cliente::where('id', $legacyClient->id)->first();

            if ($clienteLocal && empty($clienteLocal->portfolio_url)) {
                $urlCardapio = trim($legacyClient->cardapio);
                
                // Determine the correct media type based on legacy settings
                $tipoMidia = 'portfolio'; // fallback
                if (isset($legacyClient->visualiza_catalogo) && $legacyClient->visualiza_catalogo === 'Sim') {
                    $tipoMidia = 'catalogo';
                } elseif (isset($legacyClient->visualiza_cardapio) && $legacyClient->visualiza_cardapio === 'Sim') {
                    $tipoMidia = 'cardapio';
                }

                if (str_contains(strtolower($urlCardapio), 'overmelhinho.com.br') || str_contains(strtolower($urlCardapio), '.pdf')) {
                    // Try to download PDF
                    $fileContent = @file_get_contents($urlCardapio);
                    if ($fileContent !== false) {
                        $fileName = time() . '_' . basename(parse_url($urlCardapio, PHP_URL_PATH));
                        if (empty($fileName) || $fileName == time().'_') {
                            $fileName = time() . '_cardapio.pdf';
                        }

                        Storage::disk('public')->put('cardapios/' . $fileName, $fileContent);

                        $clienteLocal->portfolio_url = 'cardapios/' . $fileName;
                        $clienteLocal->tipo_arquivo_midia = $tipoMidia;
                        $clienteLocal->timestamps = false;
                        $clienteLocal->save();

                        $this->line("  [CARDAPIO] PDF baixado para cliente {$clienteLocal->id} - {$clienteLocal->nome_fantasia}");
                        $migrados_cardapio++;
                    }
                } else {
                    // It's an external link
                    $clienteLocal->portfolio_url = $urlCardapio;
                    $clienteLocal->tipo_arquivo_midia = $tipoMidia;
                    $clienteLocal->timestamps = false;
                    $clienteLocal->save();

                    $this->line("  [CARDAPIO] Link salvo para cliente {$clienteLocal->id} - {$clienteLocal->nome_fantasia}");
                    $migrados_cardapio++;
                }
            }
        }
        $this->info("Total de Cardápios/Portfólios importados: {$migrados_cardapio}\n");

        $this->info("MIGRAÇÃO CONCLUÍDA!");
    }
}
