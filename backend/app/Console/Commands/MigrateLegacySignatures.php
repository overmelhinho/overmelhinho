<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Autorizacao;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class MigrateLegacySignatures extends Command
{
    protected $signature = 'data:migrate-signatures';
    protected $description = 'Baixa as imagens das assinaturas das autorizações legadas e salva localmente no Storage público, além de convertê-las em base64 e salvar no banco.';

    private string $baseUrl = 'https://www.overmelhinho.com.br/arquivos/assinaturas/';

    public function handle()
    {
        $this->info("Iniciando resgate de assinaturas do servidor legado...");

        $autorizacoes = Autorizacao::whereNotNull('assinatura_base64')
            ->where('assinatura_base64', '!=', '')
            ->where('assinatura_base64', 'not like', 'data:image%')
            ->get();

        $total = $autorizacoes->count();
        $this->info("Total de assinaturas pendentes: {$total}");

        if ($total === 0) {
            return;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $successCount = 0;
        $failCount = 0;

        foreach ($autorizacoes as $aut) {
            $filename = $aut->assinatura_base64;
            $url = $this->baseUrl . ltrim($filename, '/');

            try {
                $response = Http::timeout(15)->get($url);

                if ($response->successful()) {
                    // Converter a imagem para base64
                    $mime = 'image/png';
                    if (str_ends_with(strtolower($filename), '.jpg') || str_ends_with(strtolower($filename), '.jpeg')) {
                        $mime = 'image/jpeg';
                    }

                    $base64 = 'data:' . $mime . ';base64,' . base64_encode($response->body());

                    // Atualiza no banco
                    $aut->assinatura_base64 = $base64;
                    $aut->save();

                    $successCount++;
                } else {
                    $failCount++;
                }
            } catch (\Exception $e) {
                $failCount++;
            }

            $bar->advance();
        }

        $bar->finish();
        
        $this->newLine(2);
        $this->info("✅ Resumo do Resgate de Assinaturas:");
        $this->line("- Convertidas com sucesso: {$successCount}");
        $this->line("- Falhas (404/Erro): {$failCount}");
        $this->newLine();
    }
}
