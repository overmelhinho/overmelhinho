<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Cliente;
use App\Models\SeoRanking;
use App\Models\SeoInsight;
use App\Models\Ticket;
use App\Models\User;
use App\Services\GoogleSearchConsoleService;
use App\Services\ClientAiService;
use Illuminate\Support\Facades\Log;

class ProcessClienteSeoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $cliente;

    /**
     * Create a new job instance.
     */
    public function __construct(Cliente $cliente)
    {
        $this->cliente = $cliente;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Iniciando SEO Check Job (Smart Motor) para Cliente ID: {$this->cliente->id}");
        
        $gsc = new GoogleSearchConsoleService();
        $serper = new \App\Services\SerperService();
        $aiService = new ClientAiService();
        
        $urlSlug = $this->cliente->slug;
        $insightUrl = 'https://www.overmelhinho.com.br/empresa/' . $urlSlug;

        // 1. Descobrir Palavras Reais via GSC (Source of Truth)
        $gscData = $gsc->getKeywordsByPage($urlSlug) ?: [];
        $gscKeywords = array_keys($gscData);

        // 2. Garantir Palavras-Chave (Fallback para IA se não houver dados no GSC nem no banco)
        $dbKeywords = $this->cliente->seo_keywords ?: [];
        
        if (empty($gscKeywords) && empty($dbKeywords)) {
            // Cliente novo sem tráfego e sem palavras: IA gera as sementes
            $cidade = 'Farroupilha'; // Ideal seria pegar do endereço do cliente, mas por ora fixamos ou pegamos do DB
            $seedKeywords = $aiService->generateSeedKeywords($this->cliente->nome_fantasia ?: $this->cliente->razao_social, $cidade);
            
            if (empty($seedKeywords)) {
                $seedKeywords = [$this->cliente->nome_fantasia ?: $this->cliente->razao_social];
            }
            
            $this->cliente->seo_keywords = $seedKeywords;
            $this->cliente->save();
            $dbKeywords = $seedKeywords;
        }

        // Fundir as palavras (O que tem no DB + O que o GSC descobriu sozinho)
        $allKeywords = array_unique(array_merge($dbKeywords, $gscKeywords));

        // Pré-carrega histórico
        $latestRankings = SeoRanking::where('cliente_id', $this->cliente->id)
            ->whereIn('keyword', $allKeywords)
            ->orderBy('created_at', 'desc')
            ->get()
            ->unique('keyword')
            ->keyBy('keyword');

        $ignoredKeywords = [];
        $hasAnomalies = false;

        foreach ($allKeywords as $keyword) {
            $lastRecord = $latestRankings->get($keyword);
            $previousPosition = $lastRecord ? $lastRecord->position : null;

            // 3. Obter Métricas
            // A prioridade para a Posição é a SERP em tempo real (Serper.dev), pois o GSC tem delay de 48h
            $serpPosition = $serper->findUrlPosition($keyword, $urlSlug, 50);
            
            $impressions = 0;
            $clicks = 0;
            $ctr = 0;
            $position = 0;

            if (isset($gscData[$keyword])) {
                $impressions = (int) round($gscData[$keyword]['impressions']);
                $clicks = (int) round($gscData[$keyword]['clicks']);
                $ctr = $gscData[$keyword]['ctr'];
                $position = (int) round($gscData[$keyword]['position']);
            }

            // Sobrescreve com a posição Real-Time da SERP se a encontrarmos
            if ($serpPosition !== null) {
                $position = $serpPosition;
            }

            // Não simulamos mais nada. Se não rankeia, fica tudo zero e não gera insights.
            $isSimulated = false;

            SeoRanking::create([
                'cliente_id' => $this->cliente->id,
                'keyword' => $keyword,
                'position' => $position,
                'previous_position' => $previousPosition,
                'clicks' => $clicks,
                'impressions' => $impressions,
                'ctr' => $ctr,
                'is_simulated' => false,
                'checked_at' => now(),
            ]);

            // Motor de Insights (SeoInsights Proativo)
            $insightType = null;
            
            // Só gera insight se a palavra realmente estiver rankeando no top 50
            if ($position > 0) {
                // Regra de CTR Baixo
                if ($impressions > 30 && $ctr < 2.0) {
                    $insightType = 'low_ctr';
                }
                // Regra Quase Lá (Página 2 ou 3)
                elseif ($position >= 11 && $position <= 30) {
                    $insightType = 'page_2';
                }
            }

            if ($insightType) {
                // Check Cooldown
                $recentOptimization = SeoInsight::where('cliente_id', $this->cliente->id)
                    ->where('keyword', $keyword)
                    ->whereIn('status', ['resolved', 'auto_applied'])
                    ->where('updated_at', '>=', now()->subDays(30))
                    ->first();

                if ($recentOptimization) {
                    Log::info("Cliente {$this->cliente->id} em quarentena SEO para '{$keyword}'.");
                    $ignoredKeywords[] = $keyword;
                } else {
                    $suggestion = $aiService->generateSeoSuggestions($keyword, $insightUrl, $insightType);

                    if (!empty($suggestion) && isset($suggestion['title'])) {
                        $hasAnomalies = true;
                        $this->cliente->update([
                            'seo_title' => $suggestion['title'],
                            'seo_description' => $suggestion['description']
                        ]);

                        SeoInsight::create([
                            'cliente_id' => $this->cliente->id,
                            'keyword' => $keyword,
                            'url' => $insightUrl,
                            'insight_type' => $insightType,
                            'position' => $position,
                            'impressions' => $impressions,
                            'clicks' => $clicks,
                            'ctr' => $ctr,
                            'status' => 'auto_applied',
                            'suggested_changes' => json_encode([
                                'title' => $suggestion['title'],
                                'description' => $suggestion['description']
                            ])
                        ]);
                    } else {
                        $hasAnomalies = true;
                        SeoInsight::updateOrCreate(
                            ['cliente_id' => $this->cliente->id, 'keyword' => $keyword, 'status' => 'pending'],
                            [
                                'url' => $insightUrl,
                                'insight_type' => $insightType,
                                'position' => $position,
                                'impressions' => $impressions,
                                'clicks' => $clicks,
                                'ctr' => $ctr
                            ]
                        );
                    }
                }
            } else {
                $ignoredKeywords[] = $keyword;
            }

            // Alerta de Queda
            if ($previousPosition && $position > 0 && ($position > $previousPosition + 3)) {
                $hasAnomalies = true;
                $this->createAlertTicket($keyword, $previousPosition, $position);
                SeoInsight::updateOrCreate(
                    ['cliente_id' => $this->cliente->id, 'keyword' => $keyword, 'status' => 'pending'],
                    ['url' => $insightUrl, 'insight_type' => 'drop', 'position' => $position, 'impressions' => $impressions, 'clicks' => $clicks, 'ctr' => $ctr]
                );
            }
        }

        if (!empty($ignoredKeywords)) {
            SeoInsight::where('cliente_id', $this->cliente->id)
                ->whereIn('keyword', $ignoredKeywords)
                ->where('status', 'pending')
                ->update(['status' => 'ignored']);
        }
        
        // Finaliza o registro de scan_progress
        $progressRecord = SeoInsight::where('cliente_id', $this->cliente->id)
            ->where('insight_type', 'scan_progress')
            ->first();

        if ($progressRecord) {
            if ($hasAnomalies) {
                // Se achou problemas reais, limpa a mensagem temporária
                $progressRecord->delete();
            } else {
                // Se está tudo saudável, transforma a linha em um check de auditoria
                $progressRecord->update([
                    'insight_type' => 'scan_ok',
                    'status' => 'healthy',
                    'keyword' => 'Varredura finalizada. Tudo 100% saudável!'
                ]);
            }
        }
        
        Log::info("Finalizado SEO Check Job para Cliente ID: {$this->cliente->id}");
    }

    private function createAlertTicket($keyword, $oldPos, $newPos)
    {
        $marketingManager = User::role(['Administrador', 'Diretor'])->first();
        $diff = $newPos - $oldPos;

        Ticket::create([
            'cliente_id' => $this->cliente->id,
            'titulo' => "Atenção: {$this->cliente->nome_fantasia} perdeu {$diff} posições no Google",
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
