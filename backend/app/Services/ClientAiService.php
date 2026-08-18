<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClientAiService
{
    protected $openaiKey;

    public function __construct()
    {
        $this->openaiKey = config('services.openai.key');
    }

    /**
     * Gera uma descrição "Sobre" de 1 parágrafo baseada no nome e cidade.
     * Tenta buscar informações no Google (via Places ou Search se disponível).
     */
    public function generateDescription(string $name, string $city): string
    {
        if (!$this->openaiKey) {
            Log::warning('[ClientAiService] OpenAI Key não configurada.');
            return '';
        }

        // 1. Coleta contexto adicional via Google Places (melhor fonte de 'resumo' disponível sem Search API)
        $placesService = app(GooglePlacesService::class);
        $details = $placesService->getDetailsByQuery("{$name} {$city}");
        
        $context = "";
        if ($details) {
            $context = "Nome no Google: {$details['name']}. Endereço: {$details['formatted_address']}. ";
            if (isset($details['website'])) $context .= "Website: {$details['website']}. ";
        }

        $prompt = "Escreva um texto 'Sobre' (descrição) de exatamente 1 parágrafo para a empresa '{$name}' em '{$city}'.\n" .
                  "Contexto extra encontrado: {$context}\n\n" .
                  "Instruções:\n" .
                  "- Use um tom profissional e convidativo.\n" .
                  "- Foque nos pontos fortes locais.\n" .
                  "- Não invente prêmios ou dados que não existam.\n" .
                  "- Máximo de 500 caracteres.";

        try {
            $response = Http::withToken($this->openaiKey)
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'system', 'content' => 'Você é um redator especializado em marketing para empresas locais luso-brasileiras.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.6
                ]);

            if (!$response->successful()) {
                Log::error('[ClientAiService] OpenAI Falhou', ['status' => $response->status(), 'body' => $response->body()]);
                return '';
            }

            return trim($response->json('choices.0.message.content'));

        } catch (\Throwable $e) {
            Log::error('[ClientAiService] Erro na geração da descrição', ['error' => $e->getMessage()]);
            return '';
        }
    }
    /**
     * Tenta prever a data de fundação da empresa via IA.
     */
    public function predictFoundationDate(string $name, string $city): ?string
    {
        if (!$this->openaiKey) return null;

        $prompt = "Identifique a data de fundação da empresa '{$name}' em '{$city}'.\n" .
                  "Responda APENAS com a data no formato YYYY-MM-DD.\n" .
                  "Se não tiver certeza, tente achar o ano e use o primeiro dia do ano (ex: 2010-01-01).\n" .
                  "Se não encontrar nenhuma pista confiável, responda apenas NULL.";

        try {
            $response = Http::withToken($this->openaiKey)
                ->timeout(20)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.0
                ]);

            if (!$response->successful()) return null;

            $result = trim($response->json('choices.0.message.content'));
            Log::info("[ClientAiService] Raw AI foundation result: " . $result);

            if (preg_match('/\d{4}-\d{2}-\d{2}/', $result, $matches)) {
                return $matches[0];
            }
            
            if (str_contains(strtoupper($result), 'NULL')) return null;

            return null;

        } catch (\Throwable $e) {
            Log::error('[ClientAiService] Erro na predição da data', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Tenta identificar as redes sociais da empresa via IA.
     */
    public function predictSocialMedia(string $name, string $city, ?string $website = null): array
    {
        if (!$this->openaiKey) return [];

        $context = "Empresa: {$name} em {$city}.";
        if ($website) $context .= " Website: {$website}.";

        $prompt = "Identifique as redes sociais (Instagram, Facebook, LinkedIn, YouTube, TikTok e X) da empresa.\n" .
                  "CONTEXTO: {$context}\n\n" .
                  "Instruções:\n" .
                  "- Retorne APENAS um JSON plano com as chaves: instagram, facebook, linkedin, youtube, tiktok, x.\n" .
                  "- Se não encontrar o link oficial, deixe o valor da chave vazio (string vazia).\n" .
                  "- Priorize links oficiais e verificados.";

        try {
            $response = Http::withToken($this->openaiKey)
                ->timeout(20)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.0
                ]);

            if (!$response->successful()) return [];

            $json = $response->json('choices.0.message.content');
            $data = is_string($json) ? json_decode($json, true) : $json;

            return is_array($data) ? $data : [];

        } catch (\Throwable $e) {
            Log::error('[ClientAiService] Erro na predição de redes sociais', ['error' => $e->getMessage()]);
            return [];
        }
    }
    /**
     * Tenta identificar depoimentos/reviews positivos reais da empresa via IA.
     * Útil quando a API do Google retorna apenas os 'relevantes' negativos.
     */
    public function findPositiveReviews(string $name, string $city): array
    {
        if (!$this->openaiKey) return [];

        $prompt = "Encontre depoimentos ou reviews reais e positivos (4 ou 5 estrelas) da empresa '{$name}' em '{$city}'.\n" .
                  "Instruções:\n" .
                  "- Retorne APENAS um JSON com uma lista de objetos com as chaves: author_name, rating, text, relative_time_description.\n" .
                  "- O campo 'text' deve ser o depoimento real, em português.\n" .
                  "- Tente encontrar depoimentos que existem publicamente no Google ou redes sociais.\n" .
                  "- Se não encontrar nada real, retorne um array vazio [].\n" .
                  "- Limite de 5 reviews.";

        try {
            $response = Http::withToken($this->openaiKey)
                ->timeout(20)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.0
                ]);

            if (!$response->successful()) return [];

            $json = $response->json('choices.0.message.content');
            $data = is_string($json) ? json_decode($json, true) : $json;

            return (isset($data['reviews']) && is_array($data['reviews'])) ? $data['reviews'] : ($data['items'] ?? []);

        } catch (\Throwable $e) {
            Log::error('[ClientAiService] Erro na busca de reviews positivos', ['error' => $e->getMessage()]);
            return [];
        }
    }

    public function parseLegacyHorario(string $legacyText): array
    {
        if (!$this->openaiKey || empty($legacyText)) return [];

        $prompt = "Converta o seguinte texto livre de horário comercial em um array JSON.\n" .
                  "TEXTO: \"{$legacyText}\"\n\n" .
                  "Instruções:\n" .
                  "- Retorne um objeto JSON contendo a chave 'horarios' com um array de 7 objetos (um para cada dia de 1 a 7).\n" .
                  "- 1=Segunda, 2=Terça, ..., 7=Domingo.\n" .
                  "- Em cada objeto, use as chaves: 'day' (int), 'closed' (boolean), 'open' (string HH:mm), 'close' (string), 'open2' (string), 'close2' (string).\n" .
                  "- Retorne os 7 dias completos.\n" .
                  "- Se não abrir de tarde, open2 e close2 devem ser vazios.\n" .
                  "- Se fechado o dia todo, closed = true, o resto vazio.";

        try {
            $response = Http::withToken($this->openaiKey)
                ->timeout(20)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.0
                ]);

            if (!$response->successful()) return [];

            $json = $response->json('choices.0.message.content');
            $data = is_string($json) ? json_decode($json, true) : $json;

            return (isset($data['horarios']) && is_array($data['horarios'])) ? $data['horarios'] : [];

        } catch (\Throwable $e) {
            Log::error('[ClientAiService] Erro no parseLegacyHorario', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Gera uma frase motivacional/foco diária via IA baseada na role do usuário.
     */
    public function generateDailyQuote(string $role): ?array
    {
        if (!$this->openaiKey) {
            Log::warning('[ClientAiService] OpenAI Key não configurada para Daily Quote.');
            return null;
        }

        $prompt = "Gere uma frase de motivação, foco, produtividade ou bem-estar para o dia de hoje.\n" .
                  "O público-alvo são mulheres profissionais que trabalham em um sistema de gestão.\n" .
                  "O cargo/função da usuária atual é: '{$role}'.\n" .
                  "Instruções:\n" .
                  "- Personalize levemente a frase para fazer sentido a esse papel (ex: para administradoras fale sobre liderança, visão geral, gestão estratégica; para operadoras gerais, fale sobre foco, organização, constância, execução brilhante; para comercial, fale sobre persistência, conexão, superação).\n" .
                  "- A frase deve ser curta (1 ou 2 sentenças, máximo 150 caracteres), motivadora, acolhedora e inspiradora. Evite clichês excessivos.\n" .
                  "- Responda APENAS com um objeto JSON plano contendo as chaves: 'text' (string, a frase em português) e 'category' (string, escolha entre: 'empoderamento', 'equilibrio', 'bem-estar', 'autoestima', 'foco', 'resiliencia').";

        try {
            $response = Http::withToken($this->openaiKey)
                ->timeout(20)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'system', 'content' => 'Você é uma inteligência artificial inspiradora especializada em desenvolvimento pessoal, produtividade e empoderamento feminino.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.8
                ]);

            if (!$response->successful()) {
                Log::error('[ClientAiService] OpenAI Daily Quote Falhou', ['status' => $response->status(), 'body' => $response->body()]);
                return null;
            }

            $json = $response->json('choices.0.message.content');
            $data = is_string($json) ? json_decode($json, true) : $json;

            if (is_array($data) && isset($data['text'])) {
                return [
                    'text' => trim($data['text']),
                    'category' => $data['category'] ?? 'autoestima'
                ];
            }

            return null;
        } catch (\Throwable $e) {
            Log::error('[ClientAiService] Erro na geração da frase diária', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Gera 3 sugestões de Title e Meta Description focadas em conversão (SEO).
     */
    public function generateSeoSuggestions(string $keyword, string $url, string $insightType): array
    {
        if (!$this->openaiKey) return [];

        $context = "";
        if ($insightType === 'low_ctr') {
            $context = "O problema atual é que a página tem muitas impressões mas pouquíssimos cliques (CTR baixo). Precisamos de um título e descrição extremamente chamativos e persuasivos (gatilhos mentais).";
        } elseif ($insightType === 'page_2') {
            $context = "A página está presa na Página 2 do Google. Precisamos de um título e descrição super otimizados usando a palavra-chave exata para dar o empurrão final para a Página 1.";
        }

        // Busca Concorrentes (SERP)
        $serper = new SerperService();
        $competitors = $serper->getTopCompetitors($keyword);
        
        $competitorsContext = "Nenhum concorrente encontrado.";
        if (!empty($competitors)) {
            $competitorsContext = "TÍTULOS E DESCRIÇÕES DOS TOP 5 CONCORRENTES NA PÁGINA 1:\n";
            foreach ($competitors as $index => $comp) {
                $pos = $index + 1;
                $competitorsContext .= "{$pos}. Título: {$comp['title']}\n   Descrição: {$comp['snippet']}\n";
            }
            $competitorsContext .= "\nSUA MISSÃO: Analise os concorrentes acima. Encontre brechas (o que falta neles? ex: gatilho de urgência, autoridade, etc). Crie 1 única opção que SE DESTAQUE no meio deles e garanta o clique para o nosso cliente.";
        }

        $prompt = "Gere a MELHOR e ÚNICA opção de <title> e <meta description> otimizada para SEO.\n" .
                  "Palavra-chave foco: '{$keyword}'\n" .
                  "URL Alvo: '{$url}'\n\n" .
                  "Contexto/Objetivo: {$context}\n\n" .
                  "{$competitorsContext}\n\n" .
                  "Instruções Técnicas:\n" .
                  "- O Title deve ter no máximo 60 caracteres.\n" .
                  "- A Meta Description deve ter no máximo 155 caracteres.\n" .
                  "- Retorne APENAS um JSON contendo as chaves 'title' e 'description'. Nenhuma palavra a mais.\n";

        try {
            $response = Http::withToken($this->openaiKey)
                ->timeout(45)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'messages' => [
                        ['role' => 'system', 'content' => 'Você é um especialista em SEO técnico e copywriting focado em bater concorrentes e maximizar CTR.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.7
                ]);

            if (!$response->successful()) return [];

            $json = $response->json('choices.0.message.content');
            $data = is_string($json) ? json_decode($json, true) : $json;

            // Transforma o formato antigo de "suggestions" para devolver direto o title/description
            // Para manter a assinatura de retorno em array do método:
            if (isset($data['title']) && isset($data['description'])) {
                return [
                    'title' => $data['title'],
                    'description' => $data['description']
                ];
            }

            return [];

        } catch (\Throwable $e) {
            Log::error('[ClientAiService] Erro na geração de SEO Suggestions', ['error' => $e->getMessage()]);
            return [];
        }
    }
}
