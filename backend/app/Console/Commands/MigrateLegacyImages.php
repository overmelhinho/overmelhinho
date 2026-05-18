<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Models\GaleriaImagem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class MigrateLegacyImages extends Command
{
    protected $signature = 'data:migrate-images';
    protected $description = 'Baixa as imagens (logos e galerias) do servidor legado e salva localmente no Storage público.';

    private string $baseUrl = 'https://www.overmelhinho.com.br/arquivos/';

    public function handle()
    {
        $this->info("Iniciando resgate de imagens do servidor legado ({$this->baseUrl})...");

        // 1. Coletar nomes de arquivos únicos (Logos)
        $this->info("Analisando Logos dos Clientes...");
        $logos = Cliente::whereNotNull('logo_url')
            ->where('logo_url', '!=', '')
            ->pluck('logo_url')
            ->toArray();

        // 2. Coletar nomes de arquivos únicos (Galeria)
        $this->info("Analisando Imagens de Galeria...");
        $galerias = GaleriaImagem::whereNotNull('url')
            ->where('url', '!=', '')
            ->pluck('url')
            ->toArray();

        // Mesclar e remover duplicatas vazias
        $allImages = array_unique(array_filter(array_merge($logos, $galerias)));
        $totalImages = count($allImages);

        $this->info("Total de arquivos únicos para baixar: {$totalImages}");

        $bar = $this->output->createProgressBar($totalImages);
        $bar->start();

        $disk = Storage::disk('public');
        $successCount = 0;
        $failCount = 0;
        $skipCount = 0;

        foreach ($allImages as $filename) {
            // Ignorar se já baixou
            if ($disk->exists($filename)) {
                $skipCount++;
                $bar->advance();
                continue;
            }

            try {
                $url = $this->baseUrl . $filename;
                
                // Timeout de 10s para não travar muito tempo se o arquivo não existir
                $response = Http::timeout(10)->get($url);

                if ($response->successful()) {
                    try {
                        // Comprimir imagem
                        $manager = new ImageManager(new Driver());
                        $image = $manager->read($response->body());
                        
                        // Escala imagem para no máximo 1200px de largura mantendo a proporção para economizar espaço
                        $image->scaleDown(width: 1200);

                        // Codifica como Webp (ou mantendo formato, mas Intervention v3 usa toJpeg)
                        $encoded = $image->toJpeg(75);
                        
                        $disk->put($filename, $encoded->toString());
                        $successCount++;
                    } catch (\Exception $e) {
                        // Fallback se falhar a compressão, salva o original
                        $disk->put($filename, $response->body());
                        $successCount++;
                    }
                } else {
                    // Arquivo possivelmente deletado no servidor antigo ou 404
                    $failCount++;
                }
            } catch (\Exception $e) {
                $failCount++;
            }

            $bar->advance();
        }

        $bar->finish();
        
        $this->newLine(2);
        $this->info("✅ Resumo do Resgate de Imagens:");
        $this->line("- Baixadas com sucesso: {$successCount}");
        $this->line("- Já existiam (Puladas): {$skipCount}");
        $this->line("- Falhas (404/Erro): {$failCount}");
        $this->newLine();
        
        // Dica amigável
        if ($failCount > 0) {
            $this->warn("Atenção: Os arquivos que falharam provavelmente já haviam sido deletados no servidor antigo ou não possuem formato válido.");
        }
    }
}
