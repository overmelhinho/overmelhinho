<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Cliente;
use App\Models\SeoRanking;
use App\Models\Ticket;
use App\Models\User;
use App\Services\GoogleSearchConsoleService;

class CheckSeoRankings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seo:check-rankings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Busca o ranqueamento SEO real via Google Search Console ou simula se a API não estiver configurada.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Iniciando checagem de SEO via Google Search Console...");

        $gsc = new GoogleSearchConsoleService();
        $clientes = \App\Models\Cliente::all();
        $realCount = 0;
        $mockCount = 0;
        $alerts = 0;

        foreach ($clientes as $cliente) {
            $registeredKeywords = $cliente->seo_keywords;
            
            if (empty($registeredKeywords) || !is_array($registeredKeywords)) {
                $keywords = [
                    $cliente->nome_fantasia ?: $cliente->razao_social,
                ];
            } else {
                $keywords = $registeredKeywords;
            }

            foreach ($keywords as $keyword) {
                // Tenta buscar dado real
                $metrics = $gsc->getKeywordMetrics($keyword);

                if ($metrics) {
                    $newPosition = $metrics['position'];
                    $clicks = $metrics['clicks'];
                    $impressions = $metrics['impressions'];
                    $ctr = $metrics['ctr'];
                    $realCount++;
                } else {
                    // Fallback para Simulação se API não estiver pronta
                    $lastRanking = SeoRanking::where('cliente_id', $cliente->id)
                        ->where('keyword', $keyword)
                        ->orderBy('created_at', 'desc')
                        ->first();

                    $prevPos = $lastRanking ? $lastRanking->position : null;
                    if (!$prevPos) {
                        $newPosition = rand(1, 40);
                    } else {
                        $oscilation = rand(-3, 3);
                        $newPosition = max(1, $prevPos + $oscilation);
                    }
                    $clicks = rand(0, 50);
                    $impressions = rand(100, 1000);
                    $ctr = ($impressions > 0) ? round(($clicks / $impressions) * 100, 2) : 0;
                    $mockCount++;
                }

                // Pegar posição anterior para o alerta
                $lastRecord = SeoRanking::where('cliente_id', $cliente->id)
                    ->where('keyword', $keyword)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                $previousPosition = $lastRecord ? $lastRecord->position : null;

                // Salvar
                SeoRanking::create([
                    'cliente_id' => $cliente->id,
                    'keyword' => $keyword,
                    'position' => $newPosition,
                    'previous_position' => $previousPosition,
                    'clicks' => $clicks,
                    'impressions' => $impressions,
                    'ctr' => $ctr,
                    'checked_at' => now(),
                ]);

                // Regra de Negócio: Alerta se cair mais de 3 posições
                if ($previousPosition && ($newPosition > $previousPosition + 3)) {
                    $this->createAlertTicket($cliente, $keyword, $previousPosition, $newPosition);
                    $alerts++;
                }
            }
        }

        $this->info("Checagem finalizada. Reais: {$realCount}, Simulados: {$mockCount}. Alertas: {$alerts}");
    }

    private function createAlertTicket($cliente, $keyword, $oldPos, $newPos)
    {
        $marketingManager = User::role(['Administrador', 'Diretor'])->first();
        $diff = $newPos - $oldPos;

        Ticket::create([
            'cliente_id' => $cliente->id,
            'titulo' => "Atenção: {$cliente->nome_fantasia} perdeu {$diff} posições no Google",
            'descricao' => "O sistema identificou uma queda no ranking para a palavra-chave: '{$keyword}'.\nPosição anterior: #{$oldPos}\nPosição atual: #{$newPos}\n\nRecomendação: Revisar palavras-chave e conteúdo vinculados ao cliente no portal.",
            'setor' => 'marketing',
            'status' => 'aberto',
            'prioridade' => 'alta',
            'tipo' => 'incidente',
            'assignee_id' => $marketingManager ? $marketingManager->id : null,
            'due_at' => now()->addDays(2),
        ]);
    }
}
