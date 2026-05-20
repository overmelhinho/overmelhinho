<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MigrateLegacyBanners extends Command
{
    protected $signature = 'migrate:legacy-banners';
    protected $description = 'Migrate legacy banners from publicidades to PostgreSQL campanhas';

    public function handle()
    {
        $this->info("Iniciando migração de banners legados...");

        // Buscar apenas publicidades com arquivo_banner2 preenchido
        $publicidades = DB::connection('legacy')->table('publicidades')
            ->whereNotNull('arquivo_banner2')
            ->where('arquivo_banner2', '!=', '')
            ->orderBy('id')
            ->get();

        $this->info("Encontradas " . count($publicidades) . " publicidades com banners (imagem 2).");

        $migrated = 0;
        $failed = 0;

        // Pre-carregar cidades para facilitar o DE-PARA
        $cidades = DB::table('cidades')->pluck('id', 'nome')->mapWithKeys(function ($id, $nome) {
            return [strtolower(trim($nome)) => $id];
        })->toArray();

        foreach ($publicidades as $lp) {
            $this->info("Processando Banner ID Legado: {$lp->id} - {$lp->titulo}");

            try {
                DB::beginTransaction();

                // Verificar se o cliente existe no sistema novo
                $clienteExists = DB::table('clientes')->where('id', $lp->id_cliente)->exists();
                if (!$clienteExists) {
                    $this->warn("Cliente ID {$lp->id_cliente} não existe. Pulando banner {$lp->id}.");
                    DB::rollBack();
                    continue;
                }

                // 1. Download da Imagem 2
                $filename = basename($lp->arquivo_banner2);
                $newPath = 'midias/banners/' . $filename;

                if (!Storage::disk('public')->exists($newPath)) {
                    $url = "https://www.overmelhinho.com.br/arquivos/" . urlencode($filename);
                    try {
                        $response = Http::get($url);
                        if ($response->successful()) {
                            Storage::disk('public')->put($newPath, $response->body());
                        } else {
                            $this->warn("Aviso: Imagem não encontrada na URL - {$url}");
                            // Tentando sem o www
                            $url2 = "https://overmelhinho.com.br/arquivos/" . urlencode($filename);
                            $response2 = Http::get($url2);
                            if ($response2->successful()) {
                                Storage::disk('public')->put($newPath, $response2->body());
                            } else {
                                $newPath = null;
                            }
                        }
                    } catch (\Exception $e) {
                        $this->warn("Aviso: Erro ao baixar imagem - " . $e->getMessage());
                        $newPath = null;
                    }
                }

                // Datas
                $dataInicio = $this->sanitizeDate($lp->data_inicial) ?: $this->sanitizeDate($lp->data_emissao) ?: now()->toDateString();
                $dataFim = $this->sanitizeDate($lp->data_final);

                $status = 'ativa';
                if ($dataFim && $dataFim < date('Y-m-d')) {
                    $status = 'encerrada';
                }

                $placementsJson = json_encode(['SEARCH_TOP', 'HOME_TOP']);

                // 2. Criar a Campanha
                $campanhaData = [
                    'cliente_id' => $lp->id_cliente,
                    'nome' => trim($lp->titulo) ?: 'Banner Legado ' . $lp->id,
                    'tipo' => 'banner',
                    'origem' => 'migracao_legado',
                    'status' => $status,
                    'data_inicio' => $dataInicio,
                    'data_fim' => $dataFim,
                    'url' => $lp->url_destino,
                    'is_institucional' => 'false', 
                    'created_at' => $dataInicio . ' 00:00:00',
                    'updated_at' => now(),
                ];

                if (\Illuminate\Support\Facades\Schema::hasColumn('campanhas', 'placements')) {
                    $campanhaData['placements'] = $placementsJson;
                } elseif (\Illuminate\Support\Facades\Schema::hasColumn('campanhas', 'placements_json')) {
                    $campanhaData['placements_json'] = $placementsJson;
                }

                $campanhaId = DB::table('campanhas')->insertGetId($campanhaData);

                // 3. Criar a Mídia
                if ($newPath) {
                    DB::table('campanha_midias')->insert([
                        'campanha_id' => $campanhaId,
                        'tipo' => 'imagem',
                        'versao' => 1,
                        'status' => 'publicado',
                        'desktop_url' => '/storage/' . $newPath,
                        'mobile_url' => '/storage/' . $newPath,
                        'meta_json' => json_encode(['ativa_desktop' => true, 'ativa_mobile' => true]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // 4. Financeiro mock (para a campanha não ficar "inadimplente")
                if (\Illuminate\Support\Facades\Schema::hasTable('campanha_financeiro')) {
                    DB::table('campanha_financeiro')->insert([
                        'campanha_id' => $campanhaId,
                        'status' => 'pago',
                        'forma' => 'migracao',
                        'valor' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // 5. Cidades
                if (!empty($lp->banner_cidades)) {
                    $nomesCidades = array_map('trim', explode(',', $lp->banner_cidades));
                    $inserirCidades = [];
                    foreach ($nomesCidades as $nomeCidade) {
                        $key = strtolower($nomeCidade);
                        if (isset($cidades[$key])) {
                            $inserirCidades[] = [
                                'campanha_id' => $campanhaId,
                                'cidade_id' => $cidades[$key],
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                    if (!empty($inserirCidades)) {
                        DB::table('campanha_cidades')->insertOrIgnore($inserirCidades);
                    }
                }

                // 6. Segmentos (Categorias)
                if (!empty($lp->banner_id_categorias)) {
                    $idsCategorias = array_map('trim', explode(',', $lp->banner_id_categorias));
                    $inserirSegmentos = [];
                    foreach ($idsCategorias as $idCat) {
                        if (is_numeric($idCat) && DB::table('segmentos')->where('id', $idCat)->exists()) {
                            $inserirSegmentos[] = [
                                'campanha_id' => $campanhaId,
                                'segmento_id' => (int) $idCat,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                    if (!empty($inserirSegmentos)) {
                        DB::table('campanha_segmentos')->insertOrIgnore($inserirSegmentos);
                    }
                }

                // 7. Keywords
                if (!empty($lp->banner_keywords)) {
                    $keywords = array_map('trim', explode(',', $lp->banner_keywords));
                    $inserirKeywords = [];
                    foreach ($keywords as $kw) {
                        // Limpar a keyword (remover # e espaços extras)
                        $cleanKw = trim(str_replace('#', '', $kw));
                        if (!empty($cleanKw)) {
                            // Normalizada = minúscula, sem acentos
                            $normalizada = Str::slug($cleanKw, ' ');
                            $inserirKeywords[] = [
                                'campanha_id' => $campanhaId,
                                'keyword_original' => $cleanKw,
                                'keyword_normalizada' => $normalizada,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                    if (!empty($inserirKeywords)) {
                        DB::table('campanha_keywords')->insertOrIgnore($inserirKeywords);
                    }
                }

                DB::commit();
                $migrated++;
            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Erro ao migrar banner {$lp->id}: " . $e->getMessage());
                $failed++;
            }
        }

        $this->info("Migração de banners concluída! Sucesso: $migrated, Falhas: $failed.");
    }

    private function sanitizeDate($date)
    {
        if (!$date || str_starts_with($date, '0000') || str_starts_with($date, '-')) {
            return null;
        }
        return $date;
    }
}
