<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Models\GaleriaImagem;

class ValidateMediaMigration extends Command
{
    protected $signature = 'midia:validar-migracao';
    protected $description = 'Valida se ficou algum arquivo físico para trás na migração';

    public function handle()
    {
        $this->info("Iniciando auditoria de mídia...");

        $clientes = Cliente::all();
        $esquecidos = 0;
        $fantasmas = 0;

        foreach ($clientes as $c) {
            $esquecidos += $this->checkFile($c->logo_url, $fantasmas);
            $esquecidos += $this->checkFile($c->banner_url, $fantasmas);
            $esquecidos += $this->checkFile($c->portfolio_url, $fantasmas);
        }

        $galerias = GaleriaImagem::all();
        foreach ($galerias as $g) {
            $esquecidos += $this->checkFile($g->url, $fantasmas);
        }

        $this->info("========================================");
        $this->info("RESULTADO DA AUDITORIA:");
        if ($esquecidos === 0) {
            $this->info("✅ SUCESSO: 100% das imagens físicas válidas foram migradas para o Supabase!");
        } else {
            $this->error("❌ ALERTA: Encontramos $esquecidos arquivos físicos que ainda estão na VPS e não foram pro Supabase.");
        }
        
        $this->warn("⚠️ Observação: O banco possui $fantasmas registros 'fantasmas' (URLs antigas cujos arquivos físicos já haviam sido deletados da VPS antes mesmo da migração). Eles foram ignorados com segurança.");
        $this->info("========================================");
    }

    private function checkFile($path, &$fantasmas)
    {
        if (empty($path)) return 0;
        if (\Illuminate\Support\Str::startsWith($path, ['http://', 'https://'])) return 0; // Já tá na nuvem

        $cleanPath = ltrim($path, '/');
        $fullPath = public_path('storage/' . $cleanPath);

        // Se a imagem não é http/https, ela DEVERIA estar no disco.
        if (file_exists($fullPath)) {
            $this->error("Arquivo esquecido no disco: " . $fullPath);
            return 1; // Arquivo físico foi esquecido e não migrado!
        } else {
            // O registro existe no banco de dados, mas o arquivo físico NÃO existe na VPS.
            // É um registro fantasma (link quebrado).
            $fantasmas++;
            return 0;
        }
    }
}
