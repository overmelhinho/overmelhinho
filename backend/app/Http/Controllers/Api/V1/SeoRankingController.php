<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SeoRanking;
use Illuminate\Http\Request;

class SeoRankingController extends Controller
{
    /**
     * Retorna os rankings de SEO de um cliente específico.
     */
    public function getClientRankings($clientId)
    {
        // Pega as últimas palavras-chave rastreadas desse cliente
        $keywords = SeoRanking::where('cliente_id', $clientId)
            ->distinct()
            ->pluck('keyword');

        $data = [];

        foreach ($keywords as $keyword) {
            // Pega o histórico dos últimos 10 registros para o gráfico
            $history = SeoRanking::where('cliente_id', $clientId)
                ->where('keyword', $keyword)
                ->orderBy('checked_at', 'desc')
                ->limit(10)
                ->get()
                ->reverse()
                ->values();

            $current = $history->last();

            if (!$current) continue;

            $data[] = [
                'keyword' => $keyword,
                'current_position' => (float)$current->position,
                'previous_position' => $current->previous_position ? (float)$current->previous_position : null,
                'clicks' => (int)$current->clicks,
                'impressions' => (int)$current->impressions,
                'ctr' => (float)$current->ctr,
                'last_checked' => $current->checked_at,
                'history' => $history->map(fn($h) => [
                    'date' => $h->checked_at->format('d/m'),
                    'position' => (float)$h->position,
                    'clicks' => (int)$h->clicks,
                    'impressions' => (int)$h->impressions,
                ])
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}
