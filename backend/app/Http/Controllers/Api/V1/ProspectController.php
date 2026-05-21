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

        $cidade = $request->cidade;
        $segmento = $request->segmento;
        $googleApiKey = config('services.google.places_key');

        if (!$googleApiKey) {
            return response()->json(['error' => 'Chave do Google Maps não configurada.'], 500);
        }

        try {
            // 1. Busca no Google Places (Text Search)
            $query = "{$segmento} em {$cidade} - RS";
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
            $clientesNaCidade = Cliente::where('cidade', 'ILIKE', '%' . $cidade . '%')
                ->pluck('nome_fantasia')
                ->filter()
                ->map(function($n) {
                    $clean = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $n)));
                    return array_values(array_filter(explode(' ', $clean), fn($w) => strlen($w) > 2));
                })->toArray();

            foreach ($rawResults as $r) {
                $placeId = $r['place_id'] ?? null;
                $name = $r['name'] ?? 'Empresa sem nome';

                // Pular se já for cliente pelo Place ID
                if ($placeId && in_array($placeId, $placeIdsExistentes)) {
                    continue;
                }

                // Filtro Inteligente Avançado (Intersecção de Palavras)
                $cleanGName = preg_replace('/[^a-z0-9]/', ' ', mb_strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $name)));
                $gWords = array_values(array_filter(explode(' ', $cleanGName), fn($w) => strlen($w) > 2));
                
                $existsByName = false;
                foreach ($clientesNaCidade as $dbWords) {
                    if (empty($dbWords) || empty($gWords)) continue;
                    
                    $intersect = array_intersect($gWords, $dbWords);
                    // Se compartilharem pelo menos 2 palavras, ou 1 palavra se a empresa só tem 1 palavra
                    if (count($intersect) >= min(2, count($dbWords))) {
                        $existsByName = true;
                        break;
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
