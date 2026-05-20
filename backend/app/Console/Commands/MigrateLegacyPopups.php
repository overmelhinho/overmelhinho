<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MigrateLegacyPopups extends Command
{
    protected $signature = 'migrate:legacy-popups';
    protected $description = 'Migrate legacy popups from MySQL to PostgreSQL campaigns';

    public function handle()
    {
        $this->info("Iniciando migração de popups...");

        $popups = DB::connection('legacy')->select("SELECT * FROM popup");
        $this->info("Encontrados " . count($popups) . " popups no legado.");

        $migrated = 0;
        $failed = 0;

        foreach ($popups as $popup) {
            $this->info("Processando: {$popup->nome_popup}");

            // Extrair o nome do arquivo da imagem
            $filename = basename($popup->imagem_popup);
            $newPath = 'midias/popups/' . $filename;
            
            // Baixar a imagem se não existir localmente
            if (!Storage::disk('public')->exists($newPath)) {
                $url = "https://overmelhinho.com.br/arquivos/popup/" . urlencode($filename);
                try {
                    $response = Http::get($url);
                    if ($response->successful()) {
                        Storage::disk('public')->put($newPath, $response->body());
                    } else {
                        $this->warn("Aviso: Imagem não encontrada - {$url}");
                        // Continua sem imagem, ou poderia pular. Vamos continuar.
                        $newPath = null;
                    }
                } catch (\Exception $e) {
                    $this->warn("Aviso: Erro ao baixar imagem - {$url}");
                    $newPath = null;
                }
            }

            try {
                DB::beginTransaction();

                // Tratar datas nulas
                $dataInicio = $popup->data_cadastro && $popup->data_cadastro != '0000-00-00' ? $popup->data_cadastro : now()->toDateString();
                $dataFim = $popup->data_validade && $popup->data_validade != '0000-00-00' ? $popup->data_validade : null;

                // Definir status: se data fim já passou, encerrada, senão ativa
                $status = 'ativa';
                if ($dataFim && $dataFim < date('Y-m-d')) {
                    $status = 'encerrada';
                }

                $placementsJson = json_encode(['POPUP_GLOBAL']);

                // 1. Criar a campanha base
                $campanhaData = [
                    'cliente_id' => null, // Popups legados parecem não ter cliente associado
                    'nome' => trim($popup->nome_popup) ?: 'Popup Legado ' . $popup->id_popup,
                    'tipo' => 'popup',
                    'origem' => 'migracao_legado',
                    'status' => $status,
                    'data_inicio' => $dataInicio,
                    'data_fim' => $dataFim,
                    'url' => $popup->url,
                    'is_institucional' => 'true', // PgSQL boolean cast
                    'created_at' => $dataInicio . ' 00:00:00',
                    'updated_at' => now(),
                ];
                
                if (\Illuminate\Support\Facades\Schema::hasColumn('campanhas', 'placements')) {
                    $campanhaData['placements'] = $placementsJson;
                } elseif (\Illuminate\Support\Facades\Schema::hasColumn('campanhas', 'placements_json')) {
                    $campanhaData['placements_json'] = $placementsJson;
                }

                $campanhaId = DB::table('campanhas')->insertGetId($campanhaData);

                // 2. Criar a mídia da campanha
                if ($newPath) {
                    DB::table('campanha_midias')->insert([
                        'campanha_id' => $campanhaId,
                        'tipo' => 'imagem',
                        'versao' => 1,
                        'status' => 'publicado',
                        'desktop_url' => '/storage/' . $newPath,
                        'mobile_url' => '/storage/' . $newPath,
                        'meta_json' => json_encode(['placement' => 'POPUP_GLOBAL']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // 3. Financeiro mock (opcional, mas bom pra manter status ativa)
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

                DB::commit();
                $migrated++;
            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Erro ao migrar popup ID {$popup->id_popup}: " . $e->getMessage());
                $failed++;
            }
        }

        $this->info("Migração concluída! Sucesso: $migrated, Falhas: $failed.");
    }
}
