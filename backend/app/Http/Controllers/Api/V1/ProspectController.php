<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Cliente;

class ProspectController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'cidade' => 'required|string',
            'segmento' => 'required|string',
        ]);

        $cidade = ($request->cidade === 'Região Geral' || mb_strtolower($request->cidade) === 'geral') ? '' : $request->cidade;
        $segmento = $request->segmento;
        $googleApiKey = config('services.google.places_key');

        if (!$googleApiKey) {
            return response()->json(['error' => 'Chave do Google Maps não configurada.'], 500);
        }

        try {
            // 1. Busca no Google Places (Text Search)
            $query = $segmento . ($cidade ? ' em ' . $cidade . ' - RS' : ' na Serra Gaúcha - RS');
            $response = Http::timeout(15)->get("https://maps.googleapis.com/maps/api/place/textsearch/json", [
                'query' => $query,
                'key' => $googleApiKey,
                'language' => 'pt-BR',
                'region' => 'br'
            ]);

            if (!$response->successful()) {
                return response()->json(['error' => 'Falha na comunicação com o Google.'], 502);
            }

            $rawResults = $response->json('results') ?? [];
            
            // 2. Processamento e filtragem
            $leads = [];
            
            // Lista de prospectivos IDs (Place IDs) do Google que já são clientes
            $placeIdsExistentes = Cliente::whereNotNull('google_place_id')
                ->pluck('google_place_id')
                ->toArray();

            // Pré-carrega e tokeniza nomes de clientes na mesma cidade para o filtro inteligente
            $clientesNaCidade = \App\Models\Cliente::whereHas('enderecos', function($q) use ($cidade) {
                    $q->where('cidade', 'ILIKE', '%' . $cidade . '%');
                })
                ->pluck('nome_fantasia')
                ->filter()
                ->map(function($n) {
                    $clean = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(\Illuminate\Support\Str::ascii($n)));
                    $words = array_filter(explode(' ', $clean), function($w) {
                        return strlen($w) > 2;
                    });
                    return array_values($words);
                })->toArray();

            foreach ($rawResults as $r) {
                $placeId = $r['place_id'] ?? null;
                $name = $r['name'] ?? 'Empresa sem nome';

                // Pular se já for cliente pelo Place ID
                if ($placeId && in_array($placeId, $placeIdsExistentes)) {
                    continue;
                }

                // Filtro Inteligente Avançado com Stopwords
                $stopwords = ['loja', 'comercial', 'comercio', 'industria', 'mercado', 'supermercado', 'padaria', 'farmacia', 'restaurante', 'lanchonete', 'pizzaria', 'bar', 'cafe', 'joalheria', 'otica', 'clinica', 'consultorio', 'escritorio', 'advocacia', 'centro', 'estetica', 'salao', 'auto', 'posto', 'mecanica', 'oficina', 'servicos', 'distribuidora', 'transportes', 'imobiliaria', 'construtora', 'arquitetura', 'engenharia', 'contabilidade', 'escola', 'academia', 'pet', 'shop', 'veterinaria', 'hospital', 'hotel', 'pousada', 'motel', 'clube', 'sindicato', 'igreja', 'templo', 'centro', 'veiculos', 'pecas', 'motopeças', 'autopeças', 'informatica', 'celulares', 'assistencia', 'tecnica', 'rs', 'brasil', 'ltda', 'me', 'epp', 'sa', 'cia', 'e', 'do', 'da', 'de', 'dos', 'das', 'com', 'para', 'por', 'na', 'no', 'nas', 'nos'];
                
                if ($cidade) {
                    $cidadeWords = explode(' ', mb_strtolower(\Illuminate\Support\Str::ascii($cidade)));
                    $stopwords = array_merge($stopwords, $cidadeWords);
                }
                $cleanGName = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(\Illuminate\Support\Str::ascii($name)));
                $gWordsAll = array_values(array_filter(explode(' ', $cleanGName), fn($w) => strlen($w) > 2));
                $gWords = array_values(array_filter($gWordsAll, fn($w) => !in_array($w, $stopwords)));
                
                $existsByName = false;
                foreach ($clientesNaCidade as $dbWords) {
                    $dbWordsFiltered = array_values(array_filter($dbWords, fn($w) => !in_array($w, $stopwords)));
                    
                    $gCompare = $gWords;
                    $dbCompare = $dbWordsFiltered;

                    $isFallback = false;
                    // Se a empresa do Google ou do Banco for composta APENAS de stopwords (ex: 'otica farroupilha'), 
                    // comparamos usando todas as palavras originais para não ignorar o match.
                    if (empty($gCompare) || empty($dbCompare)) {
                        $gCompare = $gWordsAll;
                        $dbCompare = $dbWords;
                        $isFallback = true;
                    }
                    
                    if (empty($dbCompare) || empty($gCompare)) continue;
                    
                    $intersect = array_intersect($gCompare, $dbCompare);
                    
                    if ($isFallback) {
                        $cidadeArr = $cidade ? explode(' ', mb_strtolower(\Illuminate\Support\Str::ascii($cidade))) : [];
                        $intersectSemCidade = array_diff($intersect, $cidadeArr);
                        
                        // Se a única coisa em comum é o nome da cidade, ignora o match
                        if (count($intersectSemCidade) === 0) {
                            continue;
                        }

                        if (count($intersect) >= count($dbCompare) || count($intersect) >= 2) {
                            $existsByName = true;
                            break;
                        }
                    } else {
                        // Se compartilharem pelo menos 2 palavras, ou 1 palavra se a empresa só tem 1 palavra útil
                        if (count($intersect) >= min(2, count($dbCompare))) {
                            $existsByName = true;
                            break;
                        }
                    }
                }

                if ($existsByName) {
                    continue;
                }

                $leads[] = [
                    'google_place_id' => $placeId,
                    'nome' => $r['name'] ?? 'Empresa sem nome',
                    'rating' => $r['rating'] ?? 0,
                    'user_ratings_total' => $r['user_ratings_total'] ?? 0,
                    'endereco' => $r['formatted_address'] ?? 'Endereço não informado',
                    'telefone' => $r['formatted_phone_number'] ?? ($r['phone'] ?? ''), // Pega o fone se vier na busca
                    'segmento' => $segmento,
                    'lat' => $r['geometry']['location']['lat'] ?? null,
                    'lng' => $r['geometry']['location']['lng'] ?? null,
                    'status' => $r['business_status'] ?? 'OPERATIONAL',
                ];
            }

            return response()->json([
                'data' => $leads,
                'total' => count($leads),
                'query_executed' => $query
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro interno ao processar busca: ' . $e->getMessage()], 500);
        }
    }

    public function convertToLead(Request $request)
    {
        Log::info('🎯 [RADAR] Tentativa de conversão:', $request->all());
        $request->validate([
            'nome' => 'required|string',
            'google_place_id' => 'required|string',
            'endereco' => 'nullable|string',
            'telefone' => 'nullable|string',
            'segmento' => 'nullable|string',
            'cidade' => 'nullable|string',
        ]);

        // Evitar duplicidade nos leads também
        $existente = \App\Models\Lead::where('google_place_id', $request->google_place_id)->first();
        if ($existente) {
            return response()->json(['message' => 'Este lead já está no funil.', 'lead' => $existente], 200);
        }

        $lead = \App\Models\Lead::create([
            'nome' => $request->nome,
            'status' => 'novo', // Status inicial do funil (minúsculo para bater com o banco pgsql)
            'referencia' => 'Google Places / Radar',
            'origem' => 'Radar Prospecção',
            'responsavel' => $request->user()?->name ?? 'Sistema', // Nome do vendedor para o Kanban
            'telefone' => $request->telefone,
            'endereco' => $request->endereco,
            'google_place_id' => $request->google_place_id,
            'interesse' => "Prospectado via Radar no segmento: {$request->segmento}",
            'cidade' => $request->cidade,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Lead adicionado ao funil com sucesso!',
            'data' => $lead
        ], 201);
    }
}
