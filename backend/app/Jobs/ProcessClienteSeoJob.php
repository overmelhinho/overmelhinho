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
        Log::info("Iniciando SEO Check Job para Cliente ID: {$this->cliente->id}");
        
        $gsc = new GoogleSearchConsoleService();
        
        $registeredKeywords = $this->cliente->seo_keywords;
        
        if (empty($registeredKeywords) || !is_array($registeredKeywords)) {
            $keywords = [
                $this->cliente->nome_fantasia ?: $this->cliente->razao_social,
            ];
        } else {
            $keywords = $registeredKeywords;
        }

        foreach ($keywords as $keyword) {
            // Tenta buscar dado real
            $metrics = $gsc->getKeywordMetrics($keyword);
            $isSimulated = false;
            $url = null;

            if ($metrics) {
                $newPosition = $metrics['position'];
                $clicks = $metrics['clicks'];
                $impressions = $metrics['impressions'];
                $ctr = $metrics['ctr'];
                $url = $metrics['url'] ?? null;
            } else {
                // Fallback para Simulação se API não estiver pronta
                $isSimulated = true;
                
                $lastRanking = SeoRanking::where('cliente_id', $this->cliente->id)
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
            }

            // Pegar posição anterior para o alerta
            $lastRecord = SeoRanking::where('cliente_id', $this->cliente->id)
                ->where('keyword', $keyword)
                ->orderBy('created_at', 'desc')
                ->first();
            
            $previousPosition = $lastRecord ? $lastRecord->position : null;

            // Salvar histórico de métricas
            SeoRanking::create([
                'cliente_id' => $this->cliente->id,
                'keyword' => $keyword,
                'position' => $newPosition,
                'previous_position' => $previousPosition,
                'clicks' => $clicks,
                'impressions' => $impressions,
                'ctr' => $ctr,
                'is_simulated' => $isSimulated,
                'checked_at' => now(),
            ]);

            // Motor de Insights (SeoInsights Proativo)
            // Apenas geramos insights para dados reais (não simulados)
            if (!$isSimulated && $url) {
                $insightType = null;
                
                // 1. Regra de CTR Baixo (Deixando dinheiro na mesa)
                if ($impressions > 100 && $ctr < 2.0) {
                    $insightType = 'low_ctr';
                }
                // 2. Regra Quase Lá (Página 2)
                elseif ($newPosition >= 11 && $newPosition <= 20) {
                    $insightType = 'page_2';
                }
                
                if ($insightType) {
                    SeoInsight::updateOrCreate(
                        [
                            'cliente_id' => $this->cliente->id,
                            'keyword' => $keyword,
                            'status' => 'pending'
                        ],
                        [
                            'url' => $url,
                            'insight_type' => $insightType,
                            'position' => $newPosition,
                            'impressions' => $impressions,
                            'clicks' => $clicks,
                            'ctr' => $ctr
                        ]
                    );
                } else {
                    // Se a palavra agora está bem, podemos marcar qualquer insight pendente como resolvido implicitamente
                    SeoInsight::where('cliente_id', $this->cliente->id)
                        ->where('keyword', $keyword)
                        ->where('status', 'pending')
                        ->update(['status' => 'ignored']); // Pode ser ignored ou resolved, usaremos ignored
                }
            }

            // Regra de Negócio: Alerta de Incidente se cair mais de 3 posições
            if (!$isSimulated && $previousPosition && ($newPosition > $previousPosition + 3)) {
                $this->createAlertTicket($keyword, $previousPosition, $newPosition);
                
                // Opcional: Adicionar também à tabela de insights
                SeoInsight::updateOrCreate(
                    [
                        'cliente_id' => $this->cliente->id,
                        'keyword' => $keyword,
                        'status' => 'pending'
                    ],
                    [
                        'url' => $url ?? '',
                        'insight_type' => 'drop',
                        'position' => $newPosition,
                        'impressions' => $impressions,
                        'clicks' => $clicks,
                        'ctr' => $ctr
                    ]
                );
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
