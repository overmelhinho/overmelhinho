<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LeadIntelService
{
    public function buscarDados(string $query): array
    {
        try {
            $dados = [
                'nome_fantasia' => '',
                'razao_social' => '',
                'telefone' => '',
                'email' => '',
                'endereco' => '',
                'instagram' => '',
                'facebook' => '',
                'linkedin' => '',
                'youtube' => '',
                'tiktok' => '',
                'x' => '',
                'descricao' => '',
            ];

            // 1. Buscar no Google Places API
            $googleApiKey = config('services.google.places_key');
            $response = Http::get("https://maps.googleapis.com/maps/api/place/textsearch/json", [
                'query' => $query,
                'key' => $googleApiKey,
            ]);

            if ($response->successful() && isset($response['results'][0])) {
                $place = $response['results'][0];
                $placeId = $place['place_id'] ?? null;

                // Obter detalhes completos
                if ($placeId) {
                    $detail = Http::get("https://maps.googleapis.com/maps/api/place/details/json", [
                        'place_id' => $placeId,
                        'key' => $googleApiKey,
                        'fields' => 'name,formatted_address,formatted_phone_number,website'
                    ]);

                    if ($detail->successful() && isset($detail['result'])) {
                        $result = $detail['result'];
                        $dados['nome_fantasia'] = $result['name'] ?? '';
                        $dados['telefone'] = $result['formatted_phone_number'] ?? '';
                        $dados['endereco'] = $result['formatted_address'] ?? '';
                        $website = $result['website'] ?? '';

                        // 2. Extrair redes sociais do site
                        if ($website) {
                            $redes = $this->extrairRedesSociais($website);
                            $dados = array_merge($dados, $redes);
                        }

                        // 3. GPT para gerar descrição
                        $descricao = $this->gerarDescricaoGPT($dados['nome_fantasia'], $website);
                        $dados['descricao'] = $descricao;
                    }
                }
            }

            return $dados;
        } catch (\Throwable $e) {
            Log::error('[LeadIntel] Erro na coleta de dados', [
                'erro' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'erro' => 'Falha ao buscar dados externos.'
            ];
        }
    }

    private function gerarDescricaoGPT(string $nome, string $website = ''): string
    {
        $prompt = "Descreva brevemente o negócio chamado '{$nome}'. Inclua o que ele faz, onde fica e seu diferencial. Website: {$website}";

        $apiKey = config('services.openai.key');

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
        ])->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-4',
            'messages' => [
                ['role' => 'system', 'content' => 'Você é um assistente que resume empresas de forma atrativa.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => 150,
        ]);

        if ($response->successful()) {
            return $response['choices'][0]['message']['content'] ?? '';
        }

        return '';
    }

    private function extrairRedesSociais(string $url): array
    {
        $redes = [
            'instagram' => '',
            'facebook' => '',
            'linkedin' => '',
            'youtube' => '',
            'tiktok' => '',
            'x' => '',
        ];

        try {
            $html = Http::get($url)->body();

            preg_match_all('/https?:\/\/(www\.)?(instagram|facebook|linkedin|youtube|tiktok|x|twitter)\.com\/[^\s"\'<>]+/i', $html, $matches);

            foreach ($matches[0] as $link) {
                if (str_contains($link, 'instagram.com')) $redes['instagram'] = $link;
                if (str_contains($link, 'facebook.com')) $redes['facebook'] = $link;
                if (str_contains($link, 'linkedin.com')) $redes['linkedin'] = $link;
                if (str_contains($link, 'youtube.com')) $redes['youtube'] = $link;
                if (str_contains($link, 'tiktok.com')) $redes['tiktok'] = $link;
                if (str_contains($link, 'x.com') || str_contains($link, 'twitter.com')) $redes['x'] = $link;
            }
        } catch (\Throwable $e) {
            Log::warning('[LeadIntel] Falha ao extrair redes sociais', [
                'erro' => $e->getMessage(),
                'url' => $url,
            ]);
        }

        return $redes;
    }
}
