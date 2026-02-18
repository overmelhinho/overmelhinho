<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LeadIntelService
{
    public function buscarDados(string $query, ?string $cnpj = null, ?string $cidadePreferida = null): array
    {
        Log::info("🔎 [LeadIntel] Busca: {$query}" . ($cnpj ? " | CNPJ: {$cnpj}" : ''));

        $dados = [
            'nome_fantasia' => '',
            'razao_social' => '',
            'cnpj' => '',
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
            'registro_profissional' => '',
            'inscricao_estadual' => '',
            'inscricao_municipal' => '',
            'origem_dado' => 'Merged',
            'website' => '',
        ];

        try {
            // =====================================================
            // 1) Fiscal (CNPJ) — BrasilAPI primeiro, ReceitaWS fallback
            // =====================================================
            $fiscal = [];
            if ($cnpj) {
                $fiscal = $this->consultarFiscalPorCnpj($cnpj);
                if (!empty($fiscal)) {
                    // Fiscal entra, mas NÃO deve “congelar” fantasia/site/redes
                    $dados = array_merge($dados, $fiscal);
                    $dados['origem_dado'] = $fiscal['origem_dado'] ?? 'Fiscal';
                }
            }

            // =====================================================
            // 2) Google Places (sempre roda) — pode sobrescrever campos “de vitrine”
            // =====================================================
            $places = $this->consultarGooglePlaces($query);
            if (!empty($places)) {
                // Campos “vitrine” que costumam estar mais vivos no Google
                foreach (['nome_fantasia', 'telefone', 'endereco', 'website'] as $k) {
                    if (!empty($places[$k])) {
                        $dados[$k] = $places[$k];
                    }
                }

                // Se o fiscal não trouxe razão social, usa nome do places como fallback
                if (empty($dados['razao_social']) && !empty($dados['nome_fantasia'])) {
                    $dados['razao_social'] = $dados['nome_fantasia'];
                }

                // Redes sociais: sempre extrair do website “atual” (preferindo o do Google)
                if (!empty($dados['website'])) {
                    $redes = $this->extrairRedesSociais($dados['website']);
                    foreach ($redes as $rk => $rv) {
                        if (!empty($rv)) $dados[$rk] = $rv;
                    }
                }

                // origem
                $dados['origem_dado'] = $cnpj
                    ? (($dados['origem_dado'] ?? 'Fiscal') . '+GooglePlaces')
                    : 'GooglePlaces';
            }

            // =====================================================
            // 3) Cidade preferida (para parse do frontend, sem inventar cidade do endereço)
            // =====================================================
            if ($cidadePreferida) {
                $dados['cidade_preferida'] = $cidadePreferida;
            }

            // Garantia final: se razão social vazia, usa fantasia
            if (empty($dados['razao_social']) && !empty($dados['nome_fantasia'])) {
                $dados['razao_social'] = $dados['nome_fantasia'];
            }

            // =====================================================
            // 4) Descrição “Sobre” via IA (SEO/UX) — opcional e seguro
            //    - Só gera se estiver vazia OU parecer um CNAE curto/genérico
            // =====================================================
            $descricaoAtual = trim((string)($dados['descricao'] ?? ''));
            $pareceCnaeCurto = ($descricaoAtual !== '' && mb_strlen($descricaoAtual) < 120);

            if ($descricaoAtual === '' || $pareceCnaeCurto) {
                $descIA = $this->gerarDescricaoComIA($dados, $cidadePreferida);
                if ($descIA !== '') {
                    $dados['descricao'] = $descIA;
                    $dados['origem_dado'] = ($dados['origem_dado'] ?? 'Merged') . '+DescricaoIA';
                }
            }

            Log::info("✅ [LeadIntel] Retorno", [
                'nome_fantasia' => $dados['nome_fantasia'],
                'razao_social' => $dados['razao_social'],
                'cnpj' => $dados['cnpj'],
                'website' => $dados['website'],
                'origem_dado' => $dados['origem_dado'],
            ]);

            return ['dados' => $dados];

        } catch (\Throwable $e) {
            Log::error('[LeadIntel][Erro] Falha', [
                'erro' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ['erro' => 'Falha ao buscar dados.'];
        }
    }

    // =====================================================
    // Fiscal: BrasilAPI -> ReceitaWS
    // =====================================================
    private function consultarFiscalPorCnpj(string $cnpj): array
    {
        $dados = [];

        // 1) BrasilAPI
        try {
            $resp = Http::timeout(10)->retry(2, 250)->get("https://brasilapi.com.br/api/cnpj/v1/{$cnpj}");
            if ($resp->successful()) {
                $empresa = $resp->json();

                $endereco = '';
                if (!empty($empresa)) {
                    $tipo = $empresa['descricao_tipo_logradouro'] ?? '';
                    $logradouro = $empresa['logradouro'] ?? '';
                    $numero = $empresa['numero'] ?? '';
                    $bairro = $empresa['bairro'] ?? '';
                    $municipio = $empresa['municipio'] ?? '';
                    $uf = $empresa['uf'] ?? '';
                    $cep = $empresa['cep'] ?? '';

                    $endereco = trim("{$tipo} {$logradouro}, {$numero} - {$bairro}, {$municipio} - {$uf}, {$cep}");
                }

                $dados = [
                    'cnpj' => $empresa['cnpj'] ?? $cnpj,
                    'razao_social' => $empresa['razao_social'] ?? '',
                    'nome_fantasia' => $empresa['nome_fantasia'] ?? '',
                    'descricao' => $empresa['cnae_fiscal_descricao'] ?? '',
                    'email' => $empresa['email'] ?? '',
                    'telefone' => $empresa['ddd_telefone_1'] ?? '',
                    'endereco' => $endereco,
                    'inscricao_estadual' => '',
                    'inscricao_municipal' => '',
                    'origem_dado' => 'BrasilAPI',
                ];

                Log::info("✅ [LeadIntel][BrasilAPI] OK", [
                    'cnpj' => $dados['cnpj'],
                    'razao_social' => $dados['razao_social'],
                ]);

                return $dados;
            }
        } catch (\Throwable $e) {
            Log::warning("[LeadIntel][BrasilAPI] Falhou", ['erro' => $e->getMessage()]);
        }

        // 2) ReceitaWS (fallback)
        try {
            $resp = Http::timeout(10)->retry(2, 250)->get("https://www.receitaws.com.br/v1/cnpj/{$cnpj}");
            if ($resp->successful() && $resp->json('status') === 'OK') {
                $empresa = json_decode(utf8_encode($resp->body()), true);

                $dados = [
                    'cnpj' => $empresa['cnpj'] ?? $cnpj,
                    'razao_social' => $empresa['nome'] ?? '',
                    'nome_fantasia' => $empresa['fantasia'] ?? '',
                    'descricao' => $empresa['atividade_principal'][0]['text'] ?? '',
                    'email' => $empresa['email'] ?? '',
                    'telefone' => $empresa['telefone'] ?? '',
                    'endereco' => trim("{$empresa['logradouro']}, {$empresa['numero']} - {$empresa['bairro']}, {$empresa['municipio']} - {$empresa['uf']}, {$empresa['cep']}"),
                    'inscricao_estadual' => '',
                    'inscricao_municipal' => '',
                    'origem_dado' => 'ReceitaWS',
                ];

                Log::info("✅ [LeadIntel][ReceitaWS] OK", [
                    'cnpj' => $dados['cnpj'],
                    'razao_social' => $dados['razao_social'],
                ]);

                return $dados;
            }
        } catch (\Throwable $e) {
            Log::warning("[LeadIntel][ReceitaWS] Falhou", ['erro' => $e->getMessage()]);
        }

        return [];
    }

    // =====================================================
    // Google Places
    // =====================================================
    private function consultarGooglePlaces(string $query): array
    {
        $googleApiKey = config('services.google.places_key');
        if (!$googleApiKey) return [];

        try {
            $response = Http::timeout(10)->retry(2, 250)->get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                ['query' => $query, 'key' => $googleApiKey]
            );

            if (!$response->successful() || !isset($response['results'][0])) return [];

            $place = $response['results'][0];
            $placeId = $place['place_id'] ?? null;
            if (!$placeId) return [];

            $detail = Http::timeout(10)->retry(2, 250)->get(
                "https://maps.googleapis.com/maps/api/place/details/json",
                [
                    'place_id' => $placeId,
                    'key' => $googleApiKey,
                    'fields' => 'name,formatted_address,formatted_phone_number,website'
                ]
            );

            if (!$detail->successful() || !isset($detail['result'])) return [];

            $r = $detail['result'];

            $dados = [
                'nome_fantasia' => $r['name'] ?? '',
                'telefone' => $r['formatted_phone_number'] ?? '',
                'endereco' => $r['formatted_address'] ?? '',
                'website' => $r['website'] ?? '',
            ];

            Log::info("🌍 [LeadIntel][GooglePlaces] OK", [
                'nome_fantasia' => $dados['nome_fantasia'],
                'website' => $dados['website'],
            ]);

            return $dados;

        } catch (\Throwable $e) {
            Log::warning('[LeadIntel][GooglePlaces] Falhou', [
                'erro' => $e->getMessage(),
                'query' => $query,
            ]);
            return [];
        }
    }

    // =====================================================
    // Redes sociais a partir do website
    // =====================================================
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
            $html = Http::timeout(6)->retry(1, 250)->get($url)->body();

            preg_match_all(
                '/https?:\/\/(www\.)?(instagram|facebook|linkedin|youtube|tiktok|x|twitter)\.com\/[^\s"\'<>]+/i',
                $html,
                $matches
            );

            foreach ($matches[0] as $link) {
                if (str_contains($link, 'instagram.com')) $redes['instagram'] = $link;
                if (str_contains($link, 'facebook.com')) $redes['facebook'] = $link;
                if (str_contains($link, 'linkedin.com')) $redes['linkedin'] = $link;
                if (str_contains($link, 'youtube.com')) $redes['youtube'] = $link;
                if (str_contains($link, 'tiktok.com')) $redes['tiktok'] = $link;
                if (str_contains($link, 'x.com') || str_contains($link, 'twitter.com')) $redes['x'] = $link;
            }

            Log::info("🔗 [LeadIntel][Social] OK", $redes);

        } catch (\Throwable $e) {
            Log::warning('[LeadIntel][Social] Falhou', [
                'erro' => $e->getMessage(),
                'url' => $url,
            ]);
        }

        return $redes;
    }

    // =====================================================
    // Descrição "Sobre" via IA (SEO + UX, anti-alucinação)
    // =====================================================
    private function gerarDescricaoComIA(array $dados, ?string $cidadePreferida = null): string
    {
        $apiKey = env('OPENAI_API_KEY');
        if (!$apiKey) return '';

        $nome = trim((string)($dados['nome_fantasia'] ?? ''));
        $website = trim((string)($dados['website'] ?? ''));
        $cidade = trim((string)($cidadePreferida ?? ''));
        $cnaeDesc = trim((string)($dados['descricao'] ?? ''));

        if ($nome === '' && $website === '' && $cnaeDesc === '') return '';

        $contexto = [
            'nome_fantasia' => $nome,
            'razao_social' => (string)($dados['razao_social'] ?? ''),
            'cidade_preferida' => $cidade,
            'endereco' => (string)($dados['endereco'] ?? ''),
            'telefone' => (string)($dados['telefone'] ?? ''),
            'website' => $website,
            'cnae_descricao' => $cnaeDesc,
            'instagram' => (string)($dados['instagram'] ?? ''),
            'facebook' => (string)($dados['facebook'] ?? ''),
            'linkedin' => (string)($dados['linkedin'] ?? ''),
        ];

        $contextJson = json_encode($contexto, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $prompt =
            "Você é um redator profissional para diretórios locais e páginas de empresas (PT-BR).\n" .
            "Sua missão: escrever o texto 'Sobre' (descrição) com foco em SEO e UX.\n\n" .
            "REGRAS IMPORTANTES\n" .
            "- Use SOMENTE as informações fornecidas no CONTEXTO.\n" .
            "- Não invente serviços específicos. Se não houver certeza, use termos genéricos.\n" .
            "- Não use linguagem exagerada ('melhor do mundo', 'nº1').\n" .
            "- Não faça promessas sem base.\n" .
            "- Evite keyword stuffing; inclua a cidade de forma natural se existir.\n" .
            "- Entregue: 1 parágrafo + lista com 3 a 6 bullets.\n" .
            "- Tamanho total: entre 350 e 700 caracteres.\n\n" .
            "CONTEXTO (dados reais):\n" .
            $contextJson . "\n\n" .
            "Agora escreva a DESCRIÇÃO.";

        try {
            $resp = Http::withToken($apiKey)
                ->timeout(25)
                ->retry(2, 400)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'temperature' => 0.4,
                    'messages' => [
                        ['role' => 'system', 'content' => 'Você escreve descrições curtas, claras e confiáveis para empresas locais.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                ]);

            if (!$resp->successful()) {
                Log::warning('[LeadIntel][DescricaoIA] OpenAI falhou', [
                    'status' => $resp->status(),
                    'body' => $resp->body(),
                ]);
                return '';
            }

            $text = (string) data_get($resp->json(), 'choices.0.message.content', '');
            $text = trim($text);

            // Se ficou curto demais, ignora (evita lixo)
            if (mb_strlen($text) < 120) return '';

            return $text;

        } catch (\Throwable $e) {
            Log::warning('[LeadIntel][DescricaoIA] Erro', ['erro' => $e->getMessage()]);
            return '';
        }
    }
}
