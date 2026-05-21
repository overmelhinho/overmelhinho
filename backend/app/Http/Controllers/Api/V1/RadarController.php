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
        $perPage = (int) $request->input('per_page', 8);
        $statusFilter = $request->input('status', 'all');

        $cidadesPermitidas = [
            'alto feliz', 'arroio do sal', 'barão', 'bento gonçalves', 'boa vista do sul',
            'bom princípio', 'campo bom', 'canela', 'carlos barbosa', 'caxias do sul',
            'coronel pilar', 'farroupilha', 'feliz', 'flores da cunha', 'garibaldi',
            'gramado', 'lajeado', 'monte belo do sul', 'nova prata', 'nova roma do sul',
            'novo hamburgo', 'pinto bandeira', 'salvador do sul', 'são marcos',
            'são pedro da serra', 'são sebastião do caí', 'são vendelino', 'veranópolis',
            'geral', '', 'região geral'
        ];

        // Puxa as buscas REAIS registradas no portal
        $query = \App\Models\SearchLog::selectRaw('term, city, count(*) as buscas, max(results_count) as max_concorrentes')
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->whereIn(\Illuminate\Support\Facades\DB::raw('LOWER(COALESCE(city, \'\'))'), $cidadesPermitidas)
            ->groupBy('term', 'city')
            // Oportunidades são termos que tem POUCOS CONCORRENTES (ex: <= 3 na região) e alto volume
            ->havingRaw('max(results_count) <= 3')
            ->orderByDesc('buscas');

        $rawGaps = $query->get(); // Pega todos para filtrar por status se necessário e calcular KPIs
        
        $oportunidadesTotal = [];
        $prospeccoes = \App\Models\RadarOportunidade::all()->groupBy(fn($item) => mb_strtolower($item->termo) . '|' . mb_strtolower($item->cidade));

        foreach ($rawGaps as $idx => $gap) {
            $buscas = (int) $gap->buscas;
            $concorrentes = (int) $gap->max_concorrentes;

            $temp = 'emergente';
            if ($buscas >= 100) $temp = 'alta';
            elseif ($buscas >= 50) $temp = 'media';

            $termDisplay = mb_convert_case($gap->term, MB_CASE_TITLE, "UTF-8");
            $cityDisplay = $gap->city ? mb_convert_case($gap->city, MB_CASE_TITLE, "UTF-8") : 'Região Geral';

            $key = mb_strtolower($gap->term) . '|' . mb_strtolower($gap->city ?? '');
            $prospectado = isset($prospeccoes[$key]);
            $status = $prospectado ? 'prospectado' : 'pendente';

            // Aplica filtro de status se não for 'all'
            if ($statusFilter !== 'all' && $status !== $statusFilter) {
                continue;
            }

            $oportunidadesTotal[] = [
                'id' => $idx + 1,
                'termo' => $termDisplay,
                'cidade' => $cityDisplay,
                'buscas' => $buscas,
                'concorrentes' => $concorrentes,
                'temperatura' => $temp,
                'status' => $status
            ];
        }

        // Paginação manual
        $total = count($oportunidadesTotal);
        $page = (int) $request->input('page', 1);
        $offset = ($page - 1) * $perPage;
        $paginated = array_slice($oportunidadesTotal, $offset, $perPage);

        // 2. KPIs Automáticos (Sempre do total sem filtro de status para manter contexto)
        $gapsHojeCount = count($rawGaps);
        $mrrPotencial = $gapsHojeCount * 299;
        $mrrString = "R$ " . number_format($mrrPotencial / 1000, 1, ',', '.') . "k";

        return response()->json([
            'kpis' => [
                'gaps_hoje' => $gapsHojeCount,
                'mrr_potencial' => $mrrString,
                'convertidos' => \App\Models\Lead::where('origem', 'Radar')->count()
            ],
            'oportunidades' => $paginated,
            'pagination' => [
                'total' => $total,
                'current_page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage)
            ]
        ]);
    }

    /**
     * Marca uma oportunidade como prospectada.
     */
    public function markAsProspected(Request $request)
    {
        $request->validate([
            'termo' => 'required|string',
            'cidade' => 'required|string',
        ]);

        // Normalização para bater com a index (lowercase)
        $termoRaw = mb_strtolower(trim($request->termo));
        $cidadeRaw = $request->cidade === 'Região Geral' ? '' : mb_strtolower(trim($request->cidade));

        $oportunidade = \App\Models\RadarOportunidade::updateOrCreate(
            [
                'termo' => $termoRaw,
                'cidade' => $cidadeRaw,
            ],
            [
                'status' => 'prospectado',
                'prospectado_em' => now(),
                'user_id' => $request->user()?->id
            ]
        );

        return response()->json([
            'success' => true,
            'oportunidade' => $oportunidade
        ]);
    }

    /**
     * Busca alvos potenciais no Google Maps baseados na oportunidade.
     */
    public function fetchTargets(Request $request, \App\Services\GooglePlacesService $googleService)
    {
        $request->validate([
            'termo' => 'required|string',
            'cidade' => 'required|string',
        ]);

        $termo = $request->termo;
        $cidade = $request->cidade === 'Região Geral' ? '' : $request->cidade;

        $query = $termo . ($cidade ? ' em ' . $cidade . ' - RS' : ' no estado do RS');
        $places = $googleService->searchPlaces($query);

        // Clientes existentes por Place ID
        $placeIdsExistentes = \App\Models\Cliente::whereNotNull('google_place_id')
            ->pluck('google_place_id')
            ->toArray();

        // Alvos já prospectados
        $prospectados = \App\Models\RadarAlvoProspectado::pluck('place_id')->toArray();

        $targets = [];
        foreach (array_slice($places, 0, 10) as $place) {
            $name = $place['name'];
            $placeId = $place['place_id'];
            
            // Filtro 1: Google Place ID
            if ($placeId && in_array($placeId, $placeIdsExistentes)) {
                continue;
            }

            // Filtro 2: Nome Fantasia (Legado)
            $nomeParaBusca = trim(preg_replace('/[^A-Za-z0-9 ]/', '', $name));
            if (strlen($nomeParaBusca) > 3) {
                $existsByName = \App\Models\Cliente::where('nome_fantasia', 'ILIKE', '%' . $nomeParaBusca . '%')
                    ->orWhere('razao_social', 'ILIKE', '%' . $nomeParaBusca . '%')
                    ->exists();

                if ($existsByName) {
                    continue;
                }
            }

            $targets[] = [
                'place_id' => $placeId,
                'name' => $name,
                'address' => $place['formatted_address'] ?? 'Endereço não informado',
                'rating' => $place['rating'] ?? 0,
                'user_ratings_total' => $place['user_ratings_total'] ?? 0,
                'status' => in_array($placeId, $prospectados) ? 'prospectado' : 'pendente'
            ];
        }

        return response()->json([
            'targets' => $targets
        ]);
    }

    /**
     * Marca um alvo específico como prospectado.
     */
    public function markTargetAsProspected(Request $request)
    {
        $request->validate([
            'place_id' => 'required|string',
            'name' => 'required|string',
            'termo' => 'required|string',
            'cidade' => 'required|string',
            'phone' => 'nullable|string',
        ]);

        $alvo = \App\Models\RadarAlvoProspectado::updateOrCreate(
            ['place_id' => $request->place_id],
            [
                'nome_empresa' => $request->name,
                'termo' => mb_strtolower(trim($request->termo)),
                'cidade' => $request->cidade === 'Região Geral' ? '' : mb_strtolower(trim($request->cidade)),
                'user_id' => $request->user()?->id
            ]
        );

        // ✅ Integração Automática com Kanban de Leads
        // Se o lead ainda não existe para este place_id (ou nome/telefone), criamos um novo
        $existingLead = \App\Models\Lead::where('nome', $request->name)
            ->orWhere('telefone', $request->phone)
            ->first();

        if (!$existingLead) {
            \App\Models\Lead::create([
                'nome' => $request->name,
                'telefone' => $request->phone,
                'origem' => 'Radar',
                'status' => 'em_contato', // Já iniciou contato via WhatsApp
                'responsavel' => $request->user()?->name ?? 'Sistema',
                'observacoes' => "Gerado automaticamente via Radar de Oportunidades.\nTermo: {$request->termo}\nCidade: {$request->cidade}\nGoogle Place ID: {$request->place_id}"
            ]);
        }

        return response()->json([
            'success' => true,
            'alvo' => $alvo
        ]);
    }

    /**
     * Busca os detalhes (telefone/whats) de um alvo específico.
     */
    public function getTargetDetails(Request $request, \App\Services\GooglePlacesService $googleService)
    {
        $request->validate([
            'place_id' => 'required|string',
        ]);

        $details = $googleService->getDetails($request->place_id);

        if (!$details) {
            return response()->json(['success' => false, 'message' => 'Detalhes não encontrados'], 404);
        }

        // Tenta limpar o telefone para formato internacional/whatsapp
        $phone = $details['international_phone_number'] ?? $details['formatted_phone_number'] ?? null;
        $whatsapp = null;

        if ($phone) {
            // Remove tudo que não é número
            $cleanPhone = preg_replace('/\D/', '', $phone);
            // Se for BR (começa com 55 ou tem 10/11 digitos), garante o 55
            if (strlen($cleanPhone) <= 11) {
                $whatsapp = '55' . $cleanPhone;
            } else {
                $whatsapp = $cleanPhone;
            }
        }

        return response()->json([
            'success' => true,
            'details' => [
                'name' => $details['name'],
                'phone' => $phone,
                'whatsapp' => $whatsapp,
                'website' => $details['website'] ?? null,
                'address' => $details['formatted_address'] ?? null,
            ]
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
    /**
     * Calcula o Retorno sobre Investimento (ROI) das prospecções via Radar.
     */
    public function getROI()
    {
        $radarLeadsIds = \App\Models\Lead::where('origem', 'Radar')->pluck('id');
        
        $conversoesCount = \App\Models\Lead::where('origem', 'Radar')
            ->where('status', 'convertido')
            ->count();

        // Cálculo de MRR Real (Somente de quem converteu e tem plano ativo)
        $clientesDeRadar = \App\Models\Oportunidade::whereIn('lead_id', $radarLeadsIds)
            ->whereNotNull('cliente_id')
            ->where('status', 'ganha')
            ->pluck('cliente_id');

        $mrrReal = \App\Models\Cliente::whereIn('id', $clientesDeRadar)
            ->with('plan')
            ->get()
            ->sum(fn($c) => $c->plan?->price ?? 0);

        return response()->json([
            'total_leads' => count($radarLeadsIds),
            'conversoes' => $conversoesCount,
            'taxa_conversao' => count($radarLeadsIds) > 0 ? round(($conversoesCount / count($radarLeadsIds)) * 100, 1) : 0,
            'mrr_total' => $mrrReal,
            'ticket_medio' => $conversoesCount > 0 ? round($mrrReal / $conversoesCount, 2) : 0,
            'oportunidades_abertas' => \App\Models\Oportunidade::whereIn('lead_id', $radarLeadsIds)->where('status', 'aberta')->count()
        ]);
    }
}
