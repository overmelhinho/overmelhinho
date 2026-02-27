<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RadarController extends Controller
{
    /**
     * Retorna os dados do Dashboard de Radar de Oportunidades.
     * Lista Gaps de mercado simulados (ou calculados) baseados nas buscas no portal.
     */
    public function index(Request $request)
    {
        $thirtyDaysAgo = now()->subDays(30);

        // Puxa as buscas REAIS registradas no portal
        $rawGaps = \App\Models\SearchLog::selectRaw('term, city, count(*) as buscas, max(results_count) as max_concorrentes')
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->groupBy('term', 'city')
            // Oportunidades são termos que tem POUCOS CONCORRENTES (ex: <= 3 na região) e alto volume
            ->havingRaw('max(results_count) <= 3')
            ->orderByDesc('buscas')
            ->limit(20)
            ->get();

        $oportunidades = [];

        foreach ($rawGaps as $idx => $gap) {
            $buscas = (int) $gap->buscas;
            $concorrentes = (int) $gap->max_concorrentes;

            // Temperatura comercial baseada na matemática
            $temp = 'emergente'; // Baixo volume, mas sem ninguem
            if ($buscas >= 100) $temp = 'alta';
            elseif ($buscas >= 50) $temp = 'media';

            $termDisplay = mb_convert_case($gap->term, MB_CASE_TITLE, "UTF-8");
            $cityDisplay = $gap->city ? mb_convert_case($gap->city, MB_CASE_TITLE, "UTF-8") : 'Região Geral';

            $oportunidades[] = [
                'id' => $idx + 1,
                'termo' => $termDisplay,
                'cidade' => $cityDisplay,
                'buscas' => $buscas,
                'concorrentes' => $concorrentes,
                'temperatura' => $temp
            ];
        }

        // 2. KPIs Automáticos
        $gapsHojeCount = count($oportunidades);
        $mrrPotencial = $gapsHojeCount * 299; // MRR Estimado (ticket médio R$299)
        $mrrString = "R$ " . number_format($mrrPotencial / 1000, 1, ',', '.') . "k";

        return response()->json([
            'kpis' => [
                'gaps_hoje' => $gapsHojeCount,
                'mrr_potencial' => $mrrString,
                'convertidos' => 18 // Mock: Deals Won com origem Radar
            ],
            'oportunidades' => $oportunidades
        ]);
    }

    /**
     * Usa OpenAI (GPT-4o-mini) para gerar um Pitch Comercial de WhatsApp 
     * focado na oportunidade específica.
     */
    public function generateScript(Request $request)
    {
        $request->validate([
            'termo' => 'required|string',
            'cidade' => 'required|string',
            'buscas' => 'required|integer',
            'concorrentes' => 'required|integer'
        ]);

        $termo = $request->input('termo');
        $cidade = $request->input('cidade');
        $buscas = $request->input('buscas');
        $concorrentes = $request->input('concorrentes');

        $openaiKey = config('services.openai.key');

        $fallbackScript = "Olá! Identificamos que no portal O Vermelhinho tivemos mais de {$buscas} buscas por '{$termo}' em {$cidade} nestes últimos 30 dias. A grande oportunidade é que temos apenas {$concorrentes} empresa(s) aparecendo nessas buscas. Queremos sua empresa assumindo essa demanda. Vamos mudar isso?";

        if (!$openaiKey) {
            Log::warning('[RadarController] Chave da OpenAI ausente, usando fallback.');
            return response()->json(['script' => $fallbackScript]);
        }

        $prompt = "Crie um script de Vendas (Pitch) persuasivo, direto e informal para enviar por WhatsApp para um dono de negócio.\n" .
                  "O objetivo é agendar uma demonstração do portal de classificados 'O Vermelhinho'.\n\n" .
                  "Dados da Oportunidade captada pelo nosso algoritmo:\n" .
                  "- O que os clientes buscaram recentemente: '{$termo}'\n" .
                  "- Cidade da busca: '{$cidade}'\n" .
                  "- Volume de buscas (Mês): {$buscas} buscas\n" .
                  "- Número de empresas concorrentes captando esses clientes hoje no portal: {$concorrentes} empresas.\n\n" .
                  "Regras Vitais:\n" .
                  "1. Seja empolgante, mostre que há dinheiro na mesa.\n" .
                  "2. Use gatilho de escassez/oportunidade (muita busca, pouca concorrência).\n" .
                  "3. MÁXIMO de 2 parágrafos curtos. NADA de cumprimentos longos.\n" .
                  "4. Termine com uma Chamada de Ação simples para conversar (pergunte se ele topa preencher essa demanda).";

        try {
            $response = Http::withToken($openaiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'system', 'content' => 'Você é um Hunter Comercial de Elite SaaS, especialista em Social Selling e WhatsApp Marketing.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.7
                ]);

            if ($response->successful()) {
                $script = trim($response->json('choices.0.message.content'));
                return response()->json(['script' => $script]);
            }
            
            Log::error('[RadarController] OpenAI request failed', ['status' => $response->status()]);
        } catch (\Throwable $e) {
            Log::error('[RadarController] Erro ao integrar com OpenAI', ['error' => $e->getMessage()]);
        }

        return response()->json(['script' => $fallbackScript]);
    }
}
