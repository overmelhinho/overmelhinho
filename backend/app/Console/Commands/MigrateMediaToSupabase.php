<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Models\GaleriaImagem;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MigrateMediaToSupabase extends Command
{
    protected $signature = 'midia:migrar-supabase {--limit= : Limite de registros a processar} {--dry-run : Apenas simular o processo}';
    protected $description = 'Migra imagens locais (VPS) para o bucket do Supabase';

    public function handle()
    {
        $this->info("Iniciando migração de mídias para o Supabase...");
        
        $limit = $this->option('limit');
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn("Modo DRY-RUN ativado. Nenhuma alteração real no banco será feita.");
        }

        $query = Cliente::query();
        if ($limit) {
            $query->limit((int)$limit);
        }

        $clientes = $query->get();
        $this->info("Encontrados {$clientes->count()} clientes para verificar.");

        $supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $supabaseKey = config('services.supabase.service_role_key') ?: config('services.supabase.key');
        $bucket = config('services.supabase.bucket', 'clientes-media');

        if (empty($supabaseUrl) || empty($supabaseKey)) {
            $this->error("Supabase URL ou Key não configurados no .env!");
            return;
        }

        $migratedLogos = 0;
        $migratedBanners = 0;
        $migratedPortfolios = 0;
        $migratedGallery = 0;

        foreach ($clientes as $cliente) {
            // LOGO
            if ($this->shouldMigrate($cliente->logo_url)) {
                $this->line("Migrando logo do cliente ID {$cliente->id}");
                $newPath = $this->uploadToSupabase($cliente->logo_url, "clientes/{$cliente->id}/logo", $supabaseUrl, $supabaseKey, $bucket, $isDryRun);
                if ($newPath && !$isDryRun) {
                    $cliente->logo_url = $newPath;
                    $cliente->save();
                    $migratedLogos++;
                }
            }

            // BANNER
            if ($this->shouldMigrate($cliente->banner_url)) {
                $this->line("Migrando banner do cliente ID {$cliente->id}");
                $newPath = $this->uploadToSupabase($cliente->banner_url, "clientes/{$cliente->id}/banner", $supabaseUrl, $supabaseKey, $bucket, $isDryRun);
                if ($newPath && !$isDryRun) {
                    $cliente->banner_url = $newPath;
                    $cliente->save();
                    $migratedBanners++;
                }
            }

            // PORTFOLIO
            if ($this->shouldMigrate($cliente->portfolio_url)) {
                $this->line("Migrando portfolio do cliente ID {$cliente->id}");
                $newPath = $this->uploadToSupabase($cliente->portfolio_url, "clientes/{$cliente->id}/portfolio", $supabaseUrl, $supabaseKey, $bucket, $isDryRun);
                if ($newPath && !$isDryRun) {
                    $cliente->portfolio_url = $newPath;
                    $cliente->save();
                    $migratedPortfolios++;
                }
            }
        }

        // GALERIA
        $galeriaQuery = GaleriaImagem::query();
        if ($limit) {
            $galeriaQuery->limit((int)$limit);
        }
        $imagens = $galeriaQuery->get();
        $this->info("Verificando {$imagens->count()} imagens de galeria...");

        foreach ($imagens as $img) {
            if ($this->shouldMigrate($img->url)) {
                $this->line("Migrando imagem da galeria ID {$img->id} do cliente {$img->cliente_id}");
                $newPath = $this->uploadToSupabase($img->url, "clientes/{$img->cliente_id}/galeria", $supabaseUrl, $supabaseKey, $bucket, $isDryRun);
                if ($newPath && !$isDryRun) {
                    $img->url = $newPath;
                    $img->save();
                    $migratedGallery++;
                }
            }
        }

        $this->info("====================================");
        $this->info("Resumo da Migração:");
        $this->info("Logos migrados: $migratedLogos");
        $this->info("Banners migrados: $migratedBanners");
        $this->info("Portfolios migrados: $migratedPortfolios");
        $this->info("Galeria migrada: $migratedGallery");
        $this->info("====================================");
    }

    private function shouldMigrate($path)
    {
        if (empty($path)) return false;
        if (Str::startsWith($path, ['http://', 'https://'])) return false; // Já é URL completa (Supabase ou externa)
        
        $cleanPath = ltrim($path, '/');
        // Se existe no disco físico da VPS, deve ser migrado!
        return file_exists(public_path('storage/' . $cleanPath));
    }

    private function uploadToSupabase($localPath, $destFolder, $supabaseUrl, $supabaseKey, $bucket, $isDryRun)
    {
        $cleanPath = ltrim($localPath, '/');
        $fullLocalPath = public_path('storage/' . $cleanPath);

        if (!file_exists($fullLocalPath)) {
            $this->error("Arquivo local não encontrado: {$fullLocalPath}");
            return null;
        }

        $filename = basename($cleanPath);
        // Prefixar com uniqid para evitar cache do nextjs ao usar mesmo nome antigo
        $newFilename = uniqid() . '_' . $filename;
        $destPath = $destFolder . '/' . $newFilename;

        if ($isDryRun) {
            $this->info("[DRY-RUN] Simularia upload de {$fullLocalPath} para Supabase em {$destPath}");
            return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$destPath}";
        }

        try {
            $mimeType = mime_content_type($fullLocalPath) ?: 'application/octet-stream';
            $fileContent = file_get_contents($fullLocalPath);

            // Upload via REST API do Supabase
            $uploadUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}/{$destPath}";
            
            $response = Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => $mimeType,
            ])->withBody($fileContent, $mimeType)->post($uploadUrl);

            if ($response->successful()) {
                // Retorna a URL pública completa para salvar no banco, garantindo o padrão final
                return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$destPath}";
            } else {
                $this->error("Erro no upload para o Supabase: " . $response->body());
                return null;
            }
        } catch (\Exception $e) {
            $this->error("Exceção ao tentar upload: " . $e->getMessage());
            return null;
        }
    }
}
