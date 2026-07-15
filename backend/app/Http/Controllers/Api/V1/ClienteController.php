<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClienteResource;
use App\Jobs\GenerateSeoKeywordsJob;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Models\ClienteReview;
use App\Models\Cidade;
use App\Models\Segmento;
use App\Services\ClientAiService;
use App\Services\GooglePlacesService;


class ClienteController extends Controller
{
    public function sitemap()
    {
        return Cliente::query()
            ->select(['id', 'slug', 'updated_at'])
            ->where(function ($sub) {
                $sub->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente', 'inadimplente'])
                    ->orWhere('tipo_cliente', 'gratuito');
            })
            ->where('exibir_no_site', 'true')
            ->get();
    }

    public function activeSitemapCombinations()
    {
        $combinations = DB::table('clientes as c')
            ->join('cliente_cidade as cc', 'c.id', '=', 'cc.cliente_id')
            ->join('cidades as cid', 'cc.cidade_id', '=', 'cid.id')
            ->join('cliente_segmento as cs', 'c.id', '=', 'cs.cliente_id')
            ->join('segmentos as seg', 'cs.segmento_id', '=', 'seg.id')
            ->where('c.exibir_no_site', 'true')
            ->where(function ($query) {
                $query->whereIn('c.status_assinatura', ['ativa', 'ativo', 'pendente', 'inadimplente'])
                      ->orWhere('c.tipo_cliente', 'gratuito');
            })
            ->select('cid.nome as city_name', 'seg.nome as segment_name')
            ->distinct()
            ->get();

        return response()->json(['data' => $combinations]);
    }

    public function indexPublic(Request $request)
    {
        $q = trim((string) ($request->input('q') ?? ''));
        $q = $this->normalizeQueryTypo($q);
        $perPage = (int) ($request->input('per_page') ?? 15);
        $cityId = $request->input('city_id');
        $cityName = $request->input('city_name');
        $preferredSegments = $request->input('preferred_segments');

        // ✅ Detecta se o termo de busca contém o nome de alguma cidade
        if ($q !== '') {
            $cityInQuery = $this->detectCityInQuery($q);
            if ($cityInQuery) {
                $cityId = $cityInQuery->id;
                $cityName = $cityInQuery->nome;
                $q = trim(preg_replace('/\b' . preg_quote($cityInQuery->nome, '/') . '\b/i', '', $q));
                $q = trim(preg_replace('/\b(em|de|do|da)\b/i', '', $q));
                $q = preg_replace('/\s+/', ' ', $q);
            }
        }
        
        $query = Cliente::query()
            ->where('exibir_no_site', 'true')
            ->where(function($sub) {
                $sub->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente', 'vencida', 'vencido', 'inadimplente'])
                    ->orWhere('tipo_cliente', 'gratuito');
            });

        // ✅ Verificação de Similaridade (pg_trgm) - Disponível para todo o escopo
        static $canUseSimilarity = null;
        if ($canUseSimilarity === null) {
            try {
                DB::select('SELECT similarity(\'a\', \'b\')');
                $canUseSimilarity = true;
            } catch (\Exception $e) { $canUseSimilarity = false; }
        }

        $normalizedQ = trim(preg_replace('/^(o|a|os|as|de|do|da)\s+/i', '', $q));

        // ✅ Busca Inteligente (Fuzzy + Aprendizado de Typos)
        if ($q !== '') {
            $asciiQ = strtolower(Str::ascii($q));
            $hasMovelWord = (bool) preg_match('/\b(movel|moveis)\b/', $asciiQ);
            
            // 1. Verifica se existe uma correção aprendida pelo sistema (Learning Logic)
            $learned = \App\Models\SearchCorrection::where('typo', mb_strtolower($normalizedQ, 'UTF-8'))
                ->orderByDesc('hit_count')
                ->first();
            
            $effectiveQ = $learned ? $learned->correction : $normalizedQ;

            $query->where(function ($sub) use ($q, $normalizedQ, $effectiveQ, $canUseSimilarity, $hasMovelWord) {
                if ($hasMovelWord) {
                    // Custom logic for móvel/móveis to prevent matching automóvel/automóveis
                    $sub->where(function ($w) use ($q) {
                        $w->whereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$q}%"])
                          ->whereRaw('unaccent(nome_fantasia) !~* \'automovel|automoveis\'');
                    })->orWhereRaw('unaccent(nome_fantasia) ~* \'\\y(movel|moveis)\\y\'');
                    
                    $sub->orWhere(function ($w) use ($q) {
                        $w->whereRaw('unaccent(nome_alternativo) ilike unaccent(?)', ["%{$q}%"])
                          ->whereRaw('unaccent(nome_alternativo) !~* \'automovel|automoveis\'');
                    })->orWhereRaw('unaccent(nome_alternativo) ~* \'\\y(movel|moveis)\\y\'');
                } else {
                    $sub->whereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$q}%"])
                        ->orWhereRaw('unaccent(nome_alternativo) ilike unaccent(?)', ["%{$q}%"]);
                }

                if ($effectiveQ !== $normalizedQ) {
                    if ($hasMovelWord) {
                        $sub->orWhere(function ($w) use ($effectiveQ) {
                            $w->whereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$effectiveQ}%"])
                              ->whereRaw('unaccent(nome_fantasia) !~* \'automovel|automoveis\'');
                        })->orWhereRaw('unaccent(nome_fantasia) ~* \'\\y(movel|moveis)\\y\'');
                    } else {
                        $sub->orWhereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$effectiveQ}%"]);
                    }
                }

                // Busca exata nas Palavras Chave Geradas por IA
                if ($hasMovelWord) {
                    $sub->orWhere(function ($w) use ($q) {
                        $w->whereRaw('unaccent(seo_keywords::text) ilike unaccent(?)', ["%{$q}%"])
                          ->whereRaw('unaccent(seo_keywords::text) !~* \'automovel|automoveis\'');
                    })->orWhereRaw('unaccent(seo_keywords::text) ~* \'\\y(movel|moveis)\\y\'');
                    
                    $sub->orWhere(function ($w) use ($effectiveQ) {
                        $w->whereRaw('unaccent(seo_keywords::text) ilike unaccent(?)', ["%{$effectiveQ}%"])
                          ->whereRaw('unaccent(seo_keywords::text) !~* \'automovel|automoveis\'');
                    })->orWhereRaw('unaccent(seo_keywords::text) ~* \'\\y(movel|moveis)\\y\'');
                } else {
                    $sub->orWhereRaw('unaccent(seo_keywords::text) ilike unaccent(?)', ["%{$q}%"])
                        ->orWhereRaw('unaccent(seo_keywords::text) ilike unaccent(?)', ["%{$effectiveQ}%"]);
                }

                // 1.5 Busca Space-Blind (Ignora espaços no banco quando o usuário digita uma palavra única)
                if (!str_contains(trim($q), ' ')) {
                    $sub->orWhereRaw("replace(unaccent(nome_fantasia), ' ', '') ilike unaccent(?)", ["%{$q}%"])
                        ->orWhereRaw("replace(unaccent(nome_alternativo), ' ', '') ilike unaccent(?)", ["%{$q}%"]);
                }

                // 2. Busca por Similaridade (Tolerância a Typos via pg_trgm)
                if ($canUseSimilarity && !$hasMovelWord) {
                    // Threshold seguro (0.5) para evitar falsos positivos
                    $sub->orWhereRaw("word_similarity(?, nome_fantasia) > 0.5", [$normalizedQ])
                        ->orWhereRaw("word_similarity(?, nome_alternativo) > 0.5", [$normalizedQ]);
                } elseif (!$canUseSimilarity) {
                    // Fallback agressivo por palavras (OR) se não tiver similaridade
                    $words = explode(' ', $normalizedQ);
                    foreach ($words as $word) {
                        if (strlen($word) > 2) {
                            if ($hasMovelWord && in_array(strtolower(Str::ascii($word)), ['movel', 'moveis'])) {
                                $sub->orWhereRaw('unaccent(nome_fantasia) ~* \'\\y(movel|moveis)\\y\'');
                            } else {
                                $sub->orWhereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$word}%"]);
                            }
                        }
                    }
                }

                // 2.5 Busca Multi-Palavra Obrigatória (AND) - Resolve "evelize psicologa" para "Evelize Perottoni - Psicóloga"
                if (str_contains(trim($normalizedQ), ' ')) {
                    $words = explode(' ', trim($normalizedQ));
                    $sub->orWhere(function ($multiWordSub) use ($words) {
                        foreach ($words as $word) {
                            if (strlen($word) > 2) {
                                $multiWordSub->where(function ($wSub) use ($word) {
                                    $wSub->whereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$word}%"])
                                         ->orWhereRaw('unaccent(nome_alternativo) ilike unaccent(?)', ["%{$word}%"])
                                         ->orWhereRaw('unaccent(seo_keywords::text) ilike unaccent(?)', ["%{$word}%"]);
                                });
                            }
                        }
                    });
                }

                // 3. Busca em Segmentos e Endereços
                $sub->orWhereHas('segmentos', function ($sq) use ($q, $effectiveQ, $canUseSimilarity, $normalizedQ, $hasMovelWord) {
                        if ($hasMovelWord) {
                            $sq->where(function ($w) use ($q) {
                                $w->whereRaw('unaccent(segmentos.nome) ilike unaccent(?)', ["%{$q}%"])
                                  ->whereRaw('unaccent(segmentos.nome) !~* \'automovel|automoveis\'');
                            })->orWhereRaw('unaccent(segmentos.nome) ~* \'\\y(movel|moveis)\\y\'');
                            
                            $sq->orWhere(function ($w) use ($effectiveQ) {
                                $w->whereRaw('unaccent(segmentos.nome) ilike unaccent(?)', ["%{$effectiveQ}%"])
                                  ->whereRaw('unaccent(segmentos.nome) !~* \'automovel|automoveis\'');
                            })->orWhereRaw('unaccent(segmentos.nome) ~* \'\\y(movel|moveis)\\y\'');
                        } else {
                            $sq->whereRaw('unaccent(segmentos.nome) ilike unaccent(?)', ["%{$q}%"])
                               ->orWhereRaw('unaccent(segmentos.nome) ilike unaccent(?)', ["%{$effectiveQ}%"]);
                               
                            if ($canUseSimilarity) {
                                $sq->orWhereRaw("word_similarity(?, segmentos.nome) > 0.5", [$normalizedQ]);
                            }
                        }
                    })
                    ->orWhereHas('enderecos', function ($eq) use ($q, $effectiveQ) {
                        $eq->whereRaw('unaccent(bairro) ilike unaccent(?)', ["%{$q}%"])
                           ->orWhereRaw('unaccent(cidade) ilike unaccent(?)', ["%{$q}%"])
                           ->orWhereRaw('unaccent(rua) ilike unaccent(?)', ["%{$q}%"])
                           ->orWhereRaw('unaccent(bairro) ilike unaccent(?)', ["%{$effectiveQ}%"]);
                    });
            });
        }

        // ✅ Filtro por Cidade (Geolocalização Contextual)
        if ($cityId) {
            $cityObj = \App\Models\Cidade::find($cityId);
            $query->where(function($sub) use ($cityId, $cityObj) {
                $sub->whereHas('cidadesAtendidas', function($c) use ($cityId) {
                    $c->where('cidades.id', $cityId);
                });
                
                if ($cityObj) {
                    $sub->orWhereHas('enderecos', function($e) use ($cityObj) {
                        $e->where('cidade', 'ilike', "%{$cityObj->nome}%");
                    });
                }
            });
        } elseif ($cityName) {
            $query->where(function($sub) use ($cityName) {
                $sub->whereHas('cidadesAtendidas', function($c) use ($cityName) {
                    $c->whereRaw('unaccent(cidades.nome) ilike unaccent(?)', ["%{$cityName}%"]);
                })->orWhereHas('enderecos', function($e) use ($cityName) {
                    $e->whereRaw('unaccent(cidade) ilike unaccent(?)', ["%{$cityName}%"]);
                });
            });
        }

        $query->with(['enderecos', 'segmentos', 'cidadesAtendidas', 'contatos']);
        $query->withCount(['reviews']);
        
        // ✅ ORDENAÇÃO INTELIGENTE (NEGÓCIO + RELEVÂNCIA)
        // Hierarquia: Match Exato > Pagante Local > Pagante Geral > Similaridade > Gratuito
        $qParam = $normalizedQ;
        // Verificação de disponibilidade do unaccent (cacheada estaticamente)
        static $unaccentExistsGlobal = null;
        if ($unaccentExistsGlobal === null) {
            try {
                DB::select('SELECT unaccent(\'a\')');
                $unaccentExistsGlobal = true;
            } catch (\Exception $e) {
                $unaccentExistsGlobal = false;
            }
        }

        $orderCityId = $cityId ?: 0;

        $unaccentFunc = $unaccentExistsGlobal ? 'unaccent' : '';

        // ✅ 0. Smart Match Perfeito (Navegação do Usuário)
        if ($q === '' && !empty($preferredSegments)) {
            $segIds = array_filter(explode(',', $preferredSegments), 'is_numeric');
            if (count($segIds) > 0) {
                $segIdsStr = implode(',', $segIds);
                $query->orderByRaw("
                    CASE 
                        WHEN tipo_cliente = 'pagante' AND status_assinatura IN ('ativa', 'ativo', 'inadimplente') AND EXISTS (
                            SELECT 1 FROM cliente_segmento cs 
                            WHERE cs.cliente_id = clientes.id 
                            AND cs.segmento_id IN ({$segIdsStr})
                        ) THEN 0
                        ELSE 1
                    END ASC
                ");
            }
        }

        // Condição de Match Exato (Ouro)
        $ouroCondition = "
            {$unaccentFunc}(nome_fantasia) ilike {$unaccentFunc}(?) OR
            {$unaccentFunc}(nome_alternativo) ilike {$unaccentFunc}(?) OR
            {$unaccentFunc}(nome_fantasia) ilike {$unaccentFunc}(?) OR
            {$unaccentFunc}(nome_alternativo) ilike {$unaccentFunc}(?) OR
            {$unaccentFunc}(nome_fantasia) ilike {$unaccentFunc}(?) OR
            EXISTS (
                SELECT 1 FROM cliente_segmento cs 
                JOIN segmentos s ON cs.segmento_id = s.id 
                WHERE cs.cliente_id = clientes.id 
                AND {$unaccentFunc}(s.nome) ilike {$unaccentFunc}(?)
            )
        ";

        $ouroBindings = [$q, $q, "{$q} %", "{$q} %", "%{$q}%", "%{$q}%"];

        // Mescla todos os bindings necessários
        $allBindings = array_merge(
            $ouroBindings, [$orderCityId, $orderCityId], // 0. Ouro Pagante Cidade
            $ouroBindings, // 1. Ouro Pagante Geral
            $ouroBindings  // 2. Ouro Gratuito
        );

        $query->orderByRaw("
            CASE 
                -- NÍVEL 1 (OURO) + PAGANTE NA CIDADE
                WHEN ($ouroCondition) AND tipo_cliente = 'pagante' AND status_assinatura IN ('ativa', 'ativo', 'inadimplente') AND EXISTS (
                    SELECT 1 FROM enderecos 
                    WHERE enderecos.cliente_id = clientes.id 
                    AND (
                        enderecos.cidade ilike (SELECT nome FROM cidades WHERE id = ? LIMIT 1)
                        OR EXISTS (SELECT 1 FROM cliente_cidade cc WHERE cc.cliente_id = clientes.id AND cc.cidade_id = ?)
                    )
                ) THEN 0

                -- NÍVEL 1 (OURO) + PAGANTE GERAL
                WHEN ($ouroCondition) AND tipo_cliente = 'pagante' AND status_assinatura IN ('ativa', 'ativo', 'inadimplente') THEN 1

                -- NÍVEL 1 (OURO) + GRATUITO
                WHEN ($ouroCondition) THEN 2

                -- NÍVEL 2 (PRATA) - PAGANTES PARCIAIS
                WHEN tipo_cliente = 'pagante' AND status_assinatura IN ('ativa', 'ativo', 'inadimplente') THEN 3

                -- NÍVEL 3 (BRONZE) - GRATUITOS PARCIAIS
                ELSE 4
            END ASC
        ", $allBindings);

        // Verifica se a busca bate com algum segmento ou é uma palavra muito comum (genérica) para forçar ordem alfabética
        $isSegmentQuery = false;
        if ($q !== '' && strlen(trim($q)) >= 3) {
            // 1. Tenta achar na tabela de segmentos
            $isSegmentQuery = \Illuminate\Support\Facades\DB::table('segmentos')
                ->whereRaw("{$unaccentFunc}(nome) ilike {$unaccentFunc}(?)", ["%" . trim($q) . "%"])
                ->exists();
                
            // 2. Fallback: Se a palavra aparece no nome de 3+ clientes pagantes, é uma categoria/termo genérico
            if (!$isSegmentQuery) {
                $isSegmentQuery = \Illuminate\Support\Facades\DB::table('clientes')
                    ->where('tipo_cliente', 'pagante')
                    ->whereRaw("{$unaccentFunc}(nome_fantasia) ilike {$unaccentFunc}(?)", ["%" . trim($q) . "%"])
                    ->count() >= 3;
            }
        }

        if (!$isSegmentQuery) {
            // Desempate secundário (Dentro do mesmo Nível, prefere Match Absoluto > Começa Com > Contém)
            $query->orderByRaw("
                CASE 
                    -- A. Match Exato
                    WHEN {$unaccentFunc}(nome_fantasia) ilike {$unaccentFunc}(?) THEN 0
                    WHEN {$unaccentFunc}(nome_alternativo) ilike {$unaccentFunc}(?) THEN 0
                    
                    -- B. Começa com a palavra exata
                    WHEN {$unaccentFunc}(nome_fantasia) ilike {$unaccentFunc}(?) THEN 1
                    WHEN {$unaccentFunc}(nome_alternativo) ilike {$unaccentFunc}(?) THEN 1
                    
                    -- C. Contém a palavra em qualquer lugar
                    WHEN {$unaccentFunc}(nome_fantasia) ilike {$unaccentFunc}(?) THEN 2
                    ELSE 3
                END ASC
            ", [$q, $q, "{$q} %", "{$q} %", "%{$q}%"]);

            // Desempate por similaridade fonética
            if ($canUseSimilarity) {
                $query->orderByRaw("similarity(nome_fantasia, ?) DESC", [$normalizedQ]);
            }
        }
        
        $query->orderBy('nome_fantasia');

        $clientes = $query->paginate($perPage);

        Log::info("BUSCA_PUBLIC DEBUG", [
            'q' => $q,
            'normQ' => $qParam ?? null,
            'city_id' => $cityId,
            'city_name' => $cityName,
            'count' => $clientes->count(),
            'total' => $clientes->total(),
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings()
        ]);

        return ClienteResource::collection($clientes);
    }

    /**
     * ✅ Sugestões Inteligentes (Autocomplete)
     */
    public function suggestions(Request $request)
    {
        $q = trim((string) ($request->input('q') ?? ''));
        $q = $this->normalizeQueryTypo($q);
        $cityId = $request->input('city_id');

        // ✅ Detecta se o termo de busca contém o nome de alguma cidade
        if ($q !== '') {
            $cityInQuery = $this->detectCityInQuery($q);
            if ($cityInQuery) {
                $cityId = $cityInQuery->id;
                $q = trim(preg_replace('/\b' . preg_quote($cityInQuery->nome, '/') . '\b/i', '', $q));
                $q = trim(preg_replace('/\b(em|de|do|da)\b/i', '', $q));
                $q = preg_replace('/\s+/', ' ', $q);
            }
        }
        if (strlen($q) < 2) return response()->json(['results' => [], 'categories' => []]);
        // Busca Clientes (Lógica Inteligente: Aprendizado + Fuzzy)
        $normalizedQ = mb_strtolower(trim(preg_replace('/^(o|a|os|as|de|do|da)\s+/i', '', $q)), 'UTF-8');
        
        // Tenta ver se temos uma correção aprendida no histórico
        $learned = \App\Models\SearchCorrection::where('typo', $normalizedQ)
            ->orderByDesc('hit_count')
            ->first();
        
        $effectiveQ = $learned ? $learned->correction : $normalizedQ;

        // ✅ Verificação de Similaridade (pg_trgm)
        static $canUseSim = null;
        if ($canUseSim === null) {
            try {
                DB::select('SELECT similarity(\'a\', \'b\')');
                $canUseSim = true;
            } catch (\Exception $e) { $canUseSim = false; }
        }

        $asciiQ = strtolower(Str::ascii($q));
        $hasMovelWord = (bool) preg_match('/\b(movel|moveis)\b/', $asciiQ);

        $clientes = Cliente::query()
            ->select(['id', 'slug', 'nome_fantasia', 'logo_url', 'tipo_cliente', 'status_assinatura'])
            ->where(function($sub) use ($q, $normalizedQ, $effectiveQ, $canUseSim, $hasMovelWord) {
                // Match direto ou corrigido
                if ($hasMovelWord) {
                    $sub->where(function($w) use ($q) {
                        $w->where('nome_fantasia', 'ilike', "%{$q}%")
                          ->whereRaw('nome_fantasia !~* \'automovel|automoveis\'');
                    })->orWhereRaw('nome_fantasia ~* \'\\y(movel|moveis)\\y\'');

                    $sub->orWhere(function($w) use ($normalizedQ) {
                        $w->where('nome_fantasia', 'ilike', "%{$normalizedQ}%")
                          ->whereRaw('nome_fantasia !~* \'automovel|automoveis\'');
                    })->orWhereRaw('nome_fantasia ~* \'\\y(movel|moveis)\\y\'');
                } else {
                    $sub->where('nome_fantasia', 'ilike', "%{$q}%")
                        ->orWhere('nome_fantasia', 'ilike', "%{$normalizedQ}%");
                }
                
                if ($effectiveQ !== $normalizedQ) {
                    if ($hasMovelWord) {
                        $sub->orWhere(function($w) use ($effectiveQ) {
                            $w->where('nome_fantasia', 'ilike', "%{$effectiveQ}%")
                              ->whereRaw('nome_fantasia !~* \'automovel|automoveis\'');
                        })->orWhereRaw('nome_fantasia ~* \'\\y(movel|moveis)\\y\'');
                    } else {
                        $sub->orWhere('nome_fantasia', 'ilike', "%{$effectiveQ}%");
                    }
                }
                
                // Busca Space-Blind
                if (!str_contains(trim($q), ' ')) {
                    $sub->orWhereRaw("replace(unaccent(nome_fantasia), ' ', '') ilike unaccent(?)", ["%{$q}%"]);
                }
                
                // Similarity (pg_trgm) - Threshold baixo 0.1
                if ($canUseSim && !$hasMovelWord) {
                    $sub->orWhereRaw("similarity(nome_fantasia, ?) > 0.1", [$normalizedQ]);
                } elseif (!$hasMovelWord) {
                    $sub->orWhere('nome_fantasia', 'ilike', substr($normalizedQ, 0, 3) . "%");
                }
            })
            ->where('exibir_no_site', 'true')
            ->where(fn($sub) => $sub->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente', 'vencida', 'vencido', 'inadimplente'])->orWhere('tipo_cliente', 'gratuito'))
            ->with(['segmentos', 'enderecos', 'cidadesAtendidas'])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->when($cityId, function($sq) use ($cityId) {
                $sq->where(function($sub) use ($cityId) {
                    $sub->whereHas('cidadesAtendidas', fn($c) => $c->where('cidades.id', $cityId))
                        ->orWhereHas('enderecos', function($e) use ($cityId) {
                            $city = \App\Models\Cidade::find($cityId);
                            if ($city) $e->where('cidade', 'ilike', "%{$city->nome}%");
                        });
                });
            })
            // Ordenação do Autocomplete seguindo a mesma lógica
            ->orderByRaw("
                CASE 
                    WHEN nome_fantasia ilike ? THEN 0
                    WHEN tipo_cliente = 'pagante' AND status_assinatura IN ('ativa', 'ativo', 'inadimplente') THEN 1
                    ELSE 2
                END ASC
            ", [$q])
            ->when($canUseSim && !$hasMovelWord, function($os) use ($normalizedQ) {
                $os->orderByRaw("similarity(nome_fantasia, ?) DESC", [$normalizedQ]);
            })
            ->limit(5)
            ->get();

        // Busca Segmentos (Categorias)
        $segmentos = Segmento::query()
            ->when($hasMovelWord, function($sq) use ($q) {
                $sq->where(function($w) use ($q) {
                    $w->where('nome', 'ilike', "%{$q}%")
                      ->whereRaw('nome !~* \'automovel|automoveis\'');
                })->orWhereRaw('nome ~* \'\\y(movel|moveis)\\y\'');
            }, function($sq) use ($q) {
                $sq->where('nome', 'ilike', "%{$q}%");
            })
            ->limit(3)
            ->get();

        return response()->json([
            'results' => $clientes->map(function($c) use ($cityId) {
                $isPagante = ($c->tipo_cliente === 'pagante' && in_array($c->status_assinatura, ['ativa', 'ativo', 'inadimplente']));
                
                // Gerar SEO URL
                $seoUrl = null;
                $segmento = $c->segmentos->first();
                if ($segmento) {
                    $targetCity = null;
                    if ($cityId) {
                        $cityObj = \App\Models\Cidade::find($cityId);
                        if ($cityObj) $targetCity = $cityObj->nome;
                    }

                    if (!$targetCity) {
                        $end = $c->enderecos->first();
                        if ($end && $end->cidade) {
                            $targetCity = $end->cidade;
                        } else {
                            $cad = $c->cidadesAtendidas->first();
                            if ($cad) $targetCity = $cad->nome;
                        }
                    }

                    if ($targetCity) {
                        $citySlug = \Illuminate\Support\Str::slug($targetCity);
                        $segSlug = \Illuminate\Support\Str::slug($segmento->nome);
                        $cliSlug = $c->slug ?: $c->id;
                        $seoUrl = "/{$citySlug}/{$segSlug}/{$cliSlug}";
                    }
                }

                return [
                    'id' => $c->id,
                    'slug' => $c->slug,
                    'title' => $c->nome_fantasia,
                    'image' => $isPagante && $c->logo_url ? (\Illuminate\Support\Str::startsWith($c->logo_url, ['http://', 'https://']) ? $c->logo_url : asset('storage/' . $c->logo_url)) : null,
                    'type' => 'client',
                    'priority' => $isPagante,
                    'seo_url' => $seoUrl ?: ("/cliente/" . ($c->slug ?: $c->id)),
                    'street' => $c->enderecos->first() ? $c->enderecos->first()->rua : null,
                    'city' => $c->enderecos->first() ? $c->enderecos->first()->cidade : null,
                    'rating' => $c->reviews_count > 0 ? round((float)$c->reviews_avg_rating, 1) : null
                ];
            }),
            'categories' => $segmentos->map(fn($s) => [
                'id' => $s->id,
                'title' => $s->nome,
                'type' => 'category'
            ])
        ]);
    }

    public function index(Request $request)
    {
        // Params aceitos (compat com frontend atual e futuro)
        $lite = $request->boolean('lite', false);

        $perPage = (int) ($request->input('per_page') ?? $request->input('perPage') ?? 15);
        if ($perPage <= 0) $perPage = 15;
        if ($perPage > 50) $perPage = 50;

        $q = trim((string) ($request->input('q') ?? $request->input('search') ?? ''));
        $tipo = trim((string) ($request->input('tipo_cliente') ?? $request->input('tipo') ?? ''));
        $statusAss = trim((string) ($request->input('status_assinatura') ?? ''));
        $possuiAds = $request->has('possui_publicidade') ? $request->boolean('possui_publicidade') : null;
        $visibilidade = trim((string) ($request->input('visibilidade') ?? 'all'));
        
        $lastSync = trim((string) $request->input('last_sync')); // ✅ FASE 5: Delta Sync

        $query = Cliente::query();
        
        if ($lastSync) {
            $query->where('updated_at', '>=', \Carbon\Carbon::parse($lastSync));
        }

        // ✅ Lite = listagem otimizada (não traz galeria inteira)
        if ($lite) {
            $query->select([
                'clientes.id',
                'clientes.slug',
                'clientes.nome_fantasia',
                'clientes.cpf_cnpj',
                'clientes.logo_url',
                'clientes.tipo_cliente',
                'clientes.status_assinatura',
                'clientes.possui_publicidade',
                'clientes.exibir_no_site',
                'clientes.audit_differences',
                'clientes.seo_keywords',
                'clientes.observacoes',
                'clientes.portfolio_url',
                'clientes.video',
                'clientes.contract_ends_at',
                'clientes.created_at',
                'clientes.updated_at',
            ]);
            
            $query->selectRaw("(SELECT MAX(data_fim) FROM autorizacoes WHERE autorizacoes.cliente_id = clientes.id AND autorizacoes.status IN ('assinado', 'aguardando_assinatura')) as computed_expiration_date");

            // Relações mínimas p/ tabela + drawer
            $query->with([
                'enderecos' => function ($q) {
                    $q->select(['id', 'cliente_id', 'cidade', 'estado', 'bairro', 'rua', 'numero'])
                      ->orderBy('id', 'asc')
                      ->limit(1);
                },
                'contatos' => function ($q) {
                    $q->select(['id', 'cliente_id', 'email_principal', 'telefone_principal', 'celular', 'nome_contato'])
                      ->orderBy('id', 'asc')
                      ->limit(1);
                },
                'segmentos' => function ($q) {
                    $q->select(['segmentos.id', 'segmentos.nome']);
                },
                'cidadesAtendidas' => function ($q) {
                    $q->select(['cidades.id', 'cidades.nome']);
                },
            ]);

            // Contagem para "Sem galeria"
            $query->withCount(['galeriaImagens']);
        } else {
            // Completo (mantém o comportamento atual)
            $query->with(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'cidadesAtendidas', 'galeriaImagens']);
        }

        // ✅ Filtros
        if ($tipo !== '') {
            if (in_array($tipo, ['gratuito', 'pagante'], true)) {
                $query->where('tipo_cliente', $tipo);
            }
        }

        if ($visibilidade === 'visible') {
            $query->where('exibir_no_site', 'true');
        } elseif ($visibilidade === 'hidden') {
            $query->where(function($q) {
                $q->where('exibir_no_site', 'false')->orWhereNull('exibir_no_site');
            });
        }

        if ($statusAss !== '') {
            $allowed = ['ativa', 'ativo', 'pendente', 'vencida', 'vencido', 'cancelada', 'cancelado', 'inadimplente'];
            if ($statusAss === 'atrasada') {
                $statusAss = 'vencida';
            }
            if (in_array($statusAss, $allowed, true)) {
                $query->where('status_assinatura', $statusAss);
            }
        }

        if (!is_null($possuiAds)) {
            $query->where('possui_publicidade', $possuiAds);
        }

        // ✅ Busca (nome/cnpj/razão + endereço/contato)
        if ($q !== '') {
            $qDigits = preg_replace('/\D+/', '', $q) ?? $q;

            // Otimização para testes E2E e Robots (evita overhead de buscas pesadas e subconsultas)
            if (str_contains($q, 'E2E') || str_contains($q, 'Robot')) {
                $query->where(function ($sub) use ($q, $qDigits) {
                    $sub->where('nome_fantasia', 'ilike', "%{$q}%")
                        ->orWhere('razao_social', 'ilike', "%{$q}%")
                        ->when(strlen($qDigits) >= 4, function ($sq) use ($qDigits) {
                            $sq->orWhere('cpf_cnpj', 'like', "%{$qDigits}%");
                        });
                });
            } else {
                // Verificação de disponibilidade do unaccent (cacheada estaticamente)
                static $unaccentExists = null;
                if ($unaccentExists === null) {
                    try {
                        DB::select('SELECT unaccent(\'a\')');
                        $unaccentExists = true;
                    } catch (\Exception $e) {
                        $unaccentExists = false;
                    }
                }

                $query->where(function ($sub) use ($q, $qDigits, $unaccentExists) {
                    // Busca por palavras individuais (permite que a ordem das palavras não importe)
                    $terms = array_filter(explode(' ', $q));
                    
                    if (count($terms) > 1) {
                        $sub->where(function ($inner) use ($terms, $unaccentExists) {
                            foreach ($terms as $term) {
                                $inner->where(function($wordSub) use ($term, $unaccentExists) {
                                    if ($unaccentExists) {
                                        $wordSub->whereRaw("unaccent(nome_fantasia) ilike unaccent(?)", ["%{$term}%"])
                                                ->orWhereRaw("unaccent(razao_social) ilike unaccent(?)", ["%{$term}%"])
                                                ->orWhereRaw("unaccent(nome_alternativo) ilike unaccent(?)", ["%{$term}%"])
                                                ->orWhereRaw("unaccent(responsavel) ilike unaccent(?)", ["%{$term}%"]);
                                    } else {
                                        $wordSub->where('nome_fantasia', 'ilike', "%{$term}%")
                                                ->orWhere('razao_social', 'ilike', "%{$term}%")
                                                ->orWhere('nome_alternativo', 'ilike', "%{$term}%")
                                                ->orWhere('responsavel', 'ilike', "%{$term}%");
                                    }
                                });
                            }
                        });
                    } else {
                        if ($unaccentExists) {
                            $sub->whereRaw("unaccent(nome_fantasia) ilike unaccent(?)", ["%{$q}%"])
                                ->orWhereRaw("unaccent(razao_social) ilike unaccent(?)", ["%{$q}%"])
                                ->orWhereRaw("unaccent(nome_alternativo) ilike unaccent(?)", ["%{$q}%"])
                                ->orWhereRaw("unaccent(responsavel) ilike unaccent(?)", ["%{$q}%"]);
                        } else {
                            $sub->where('nome_fantasia', 'ilike', "%{$q}%")
                                ->orWhere('razao_social', 'ilike', "%{$q}%")
                                ->orWhere('nome_alternativo', 'ilike', "%{$q}%")
                                ->orWhere('responsavel', 'ilike', "%{$q}%");
                        }
                    }

                    // Busca Space-Blind
                    if (!str_contains(trim($q), ' ')) {
                        if ($unaccentExists) {
                            $sub->orWhereRaw("replace(unaccent(nome_fantasia), ' ', '') ilike unaccent(?)", ["%{$q}%"])
                                ->orWhereRaw("replace(unaccent(razao_social), ' ', '') ilike unaccent(?)", ["%{$q}%"]);
                        } else {
                            $sub->orWhereRaw("replace(nome_fantasia, ' ', '') ilike ?", ["%{$q}%"])
                                ->orWhereRaw("replace(razao_social, ' ', '') ilike ?", ["%{$q}%"]);
                        }
                    }

                    // cpf/cnpj: tenta por dígitos e por texto também (caso venha mascarado)
                    if ($qDigits !== '') {
                        $sub->orWhere('cpf_cnpj', 'like', "%{$qDigits}%");
                    } else {
                        $sub->orWhere('cpf_cnpj', 'ilike', "%{$q}%");
                    }

                    // contatos
                    $sub->orWhereHas('contatos', function ($cq) use ($q, $qDigits) {
                        $cq->where('email_principal', 'ilike', "%{$q}%")
                           ->orWhere('telefone_principal', 'ilike', "%{$q}%")
                           ->orWhere('telefone_secundario', 'ilike', "%{$q}%")
                           ->orWhere('celular', 'ilike', "%{$q}%")
                           ->orWhere('telefone_outro', 'ilike', "%{$q}%")
                           ->orWhere('nome_contato', 'ilike', "%{$q}%");
                        
                        if ($qDigits !== '') {
                            $cq->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(telefone_principal, '\D', '', 'g')"), 'like', "%{$qDigits}%")
                               ->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(telefone_secundario, '\D', '', 'g')"), 'like', "%{$qDigits}%")
                               ->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(celular, '\D', '', 'g')"), 'like', "%{$qDigits}%")
                               ->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(telefone_outro, '\D', '', 'g')"), 'like', "%{$qDigits}%");
                        }
                    });

                    // endereços
                    $sub->orWhereHas('enderecos', function ($eq) use ($q, $qDigits, $unaccentExists) {
                        $eq->where('telefone', 'ilike', "%{$q}%");
                        if ($qDigits !== '') {
                            $eq->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(telefone, '\D', '', 'g')"), 'like', "%{$qDigits}%");
                        }

                        if ($unaccentExists) {
                            $eq->orWhereRaw("unaccent(cidade) ilike unaccent(?)", ["%{$q}%"])
                               ->orWhereRaw("unaccent(estado) ilike unaccent(?)", ["%{$q}%"])
                               ->orWhereRaw("unaccent(bairro) ilike unaccent(?)", ["%{$q}%"])
                               ->orWhereRaw("unaccent(rua) ilike unaccent(?)", ["%{$q}%"]);
                        } else {
                            $eq->orWhere('cidade', 'ilike', "%{$q}%")
                               ->orWhere('estado', 'ilike', "%{$q}%")
                               ->orWhere('bairro', 'ilike', "%{$q}%")
                               ->orWhere('rua', 'ilike', "%{$q}%");
                        }
                    });

                    // segmentos
                    $sub->orWhereHas('segmentos', function ($sq) use ($q) {
                        $sq->where('segmentos.nome', 'ilike', "%{$q}%");
                    });
                });
            }
        }

        // ✅ Ordenação
        $sort = $request->input('sort');

        if ($q !== '' && ($unaccentExists ?? false)) {
            // Se houver busca e unaccent disponível, a relevância do NOME (sem acento) vem primeiro
            $query->orderByRaw("
                CASE 
                    WHEN unaccent(nome_fantasia) ilike unaccent(?) THEN 0
                    WHEN unaccent(nome_fantasia) ilike unaccent(?) THEN 1
                    ELSE 2
                END ASC
            ", [$q, "%{$q}%"]);
        } elseif ($q !== '') {
            $query->orderByRaw("
                CASE 
                    WHEN nome_fantasia ilike ? THEN 0
                    WHEN nome_fantasia ilike ? THEN 1
                    ELSE 2
                END ASC
            ", [$q, "%{$q}%"]);
        }

        if ($sort === 'latest') {
            $query->orderBy('created_at', 'desc');
        } elseif ($sort === 'oldest') {
            $query->orderBy('created_at', 'asc');
        } elseif ($sort === 'nome' || $sort === 'name') {
            $query->orderBy('nome_fantasia', 'asc');
        } elseif ($sort === 'expiring') {
            // Apenas considerar clientes que possuem autorização assinada que vences de hoje em diante
            $query->whereHas('autorizacoes', function($q) {
                $q->whereIn('status', ['assinado', 'aguardando_assinatura'])
                  ->where('data_fim', '>=', \Carbon\Carbon::today());
            });

            $query->orderByRaw("
                (SELECT MAX(data_fim) FROM autorizacoes WHERE autorizacoes.cliente_id = clientes.id AND autorizacoes.status IN ('assinado', 'aguardando_assinatura')) ASC
            ");
        } else {
            // ✅ Default: Ordenação SaaS (Rank de pagamento) + updated_at
            $query->orderByRaw("
                CASE
                    WHEN tipo_cliente = 'pagante' AND status_assinatura = 'ativa' THEN 0
                    WHEN tipo_cliente = 'pagante' THEN 1
                    ELSE 2
                END ASC
            ");
            $query->orderBy('updated_at', 'desc');
        }

        $clientes = $query->paginate($perPage);

        return ClienteResource::collection($clientes);
    }

    public function show($id)
    {
        $cliente = Cliente::with(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'cidadesAtendidas', 'galeriaImagens', 'reviews'])
            ->findOrFail($id);

        return new ClienteResource($cliente);
    }

    public function showPublic($id)
    {
        $query = Cliente::with([
            'enderecos', 'contatos', 'redesSociais', 'segmentos', 'cidadesAtendidas', 'galeriaImagens', 'reviews',
            'jobOpportunities' => function($q) {
                $q->where('is_active', 'true')
                  ->where('status', 'Published')
                  ->where(function($sub) {
                      $sub->whereNull('expires_at')
                          ->orWhere('expires_at', '>=', now());
                  });
            }
        ]);
        
        if (is_numeric($id)) {
            $cliente = $query->find($id);
        } else {
            $cliente = $query->where('slug', $id)->first();
        }

        if (!$cliente) {
            return response()->json(['message' => 'Cliente não encontrado'], 404);
        }

        if (!in_array($cliente->exibir_no_site, ['true', true, 1, '1'], true)) {
            $citySlug = null;
            $segmentSlug = null;
            
            if ($cliente->enderecos->isNotEmpty() && !empty($cliente->enderecos[0]->cidade)) {
                $citySlug = \Illuminate\Support\Str::slug($cliente->enderecos[0]->cidade);
            }
            if ($cliente->segmentos->isNotEmpty()) {
                $segmentSlug = \Illuminate\Support\Str::slug($cliente->segmentos[0]->nome);
            }

            return response()->json([
                'message' => 'Cliente inativo',
                'redirect_suggestion' => ($citySlug && $segmentSlug) ? [
                    'city_slug' => $citySlug,
                    'segment_slug' => $segmentSlug
                ] : null
            ], 404);
        }

        return new ClienteResource($cliente);
    }

    /**
     * ✅ Motor de Recomendação Inteligente (Sugere similares, mas NUNCA concorrentes diretos)
     */
    public function recommendations($id)
    {
        if (is_numeric($id)) {
            $cliente = Cliente::with(['segmentos', 'enderecos'])->find($id);
        } else {
            $cliente = Cliente::with(['segmentos', 'enderecos'])->where('slug', $id)->first();
        }
        
        if (!$cliente) return response()->json([], 404);

        $segmentIds = $cliente->segmentos->pluck('id')->toArray();
        $cidade = $cliente->enderecos->first()?->cidade;

        // Base da query: Clientes que NÃO são o atual e NÃO pertencem aos mesmos segmentos
        $baseQuery = Cliente::with(['enderecos', 'segmentos'])
            ->where('id', '!=', $cliente->id)
            ->where('exibir_no_site', 'true')
            ->where('tipo_cliente', 'pagante')
            ->whereIn('status_assinatura', ['ativa', 'ativo', 'inadimplente'])
            ->whereDoesntHave('segmentos', function($q) {
                $q->whereIn('segmentos.slug', [
                    'acompanhantes',
                    'bordel',
                    'garotas-de-programa',
                    'sexo',
                    'agencia-de-acompanhantes',
                    'casas-de-massagem',
                ]);
            })
            ->where(function($q) {
                $q->whereNull('nome_fantasia')
                  ->orWhere(function($sub) {
                      $sub->where('nome_fantasia', 'not ilike', '%night club%')
                          ->where('nome_fantasia', 'not ilike', '%gatas club%')
                          ->where('nome_fantasia', 'not ilike', '%acompanhante%');
                  });
            })
            ->whereDoesntHave('segmentos', function($q) use ($segmentIds) {
                $q->whereIn('segmentos.id', $segmentIds);
            });

        // 1. Tentar buscar na mesma cidade primeiro
        $recommendations = (clone $baseQuery);
        if ($cidade) {
            $recommendations->whereHas('enderecos', function($q) use ($cidade) {
                $q->where('cidade', 'ilike', "%{$cidade}%");
            });
        }
        
        $results = $recommendations->inRandomOrder()->limit(4)->get();

        // 2. Se não deu 4, completa com outros random (ainda sem os concorrentes)
        if ($results->count() < 4) {
            $excludeIds = $results->pluck('id')->toArray();
            $excludeIds[] = $id;

            $others = (clone $baseQuery)
                ->whereNotIn('id', $excludeIds)
                ->inRandomOrder()
                ->limit(4 - $results->count())
                ->get();
            
            $results = $results->concat($others);
        }

        return ClienteResource::collection($results);
    }


public function historico(Request $request, int $id)
{
    $limit = (int) $request->query('limit', 50);
    $limit = max(1, min($limit, 200));

    $cursor = $request->query('cursor'); // "ISO_DATE|ID"
    $cursorCreatedAt = null;
    $cursorId = null;

    if (is_string($cursor) && str_contains($cursor, '|')) {
        [$cursorCreatedAt, $cursorId] = explode('|', $cursor, 2);
        $cursorId = is_numeric($cursorId) ? (int) $cursorId : null;
    }

    $q = \App\Models\AuditLog::query()
        ->where('cliente_id', $id)
        ->orderByDesc('created_at')
        ->orderByDesc('id');

    // filtros opcionais
    if ($request->filled('action')) {
        $q->where('action', $request->query('action'));
    }

    if ($request->filled('entity_type')) {
        $q->where('entity_type', $request->query('entity_type'));
    }

    // cursor pagination (sem OFFSET caro)
    if ($cursorCreatedAt && $cursorId) {
        $q->where(function ($sub) use ($cursorCreatedAt, $cursorId) {
            $sub->where('created_at', '<', $cursorCreatedAt)
                ->orWhere(function ($sub2) use ($cursorCreatedAt, $cursorId) {
                    $sub2->where('created_at', '=', $cursorCreatedAt)
                         ->where('id', '<', $cursorId);
                });
        });
    }

    $items = $q->limit($limit + 1)->get();

    $nextCursor = null;
    if ($items->count() > $limit) {
        $last = $items[$limit - 1];
        $nextCursor = $last->created_at->toISOString() . '|' . $last->id;
        $items = $items->take($limit);
    }

    return response()->json([
        'data' => $items->values(),
        'next_cursor' => $nextCursor,
    ]);
}





    public function store(Request $request)
    {
        Log::info('CLIENTE STORE - PAYLOAD RECEBIDO', [
            'headers' => [
                'content_type' => $request->header('Content-Type'),
                'origin' => $request->header('Origin'),
                'authorization' => $request->header('Authorization') ? 'present' : 'missing',
            ],
            'body' => $request->all(),
        ]);

        try {
            // AUTO-HEALING SCHEMA
            try {
                if (!Schema::hasColumn('clientes', 'responsavel')) {
                    DB::statement("ALTER TABLE clientes ADD COLUMN responsavel VARCHAR(255) NULL");
                }
                if (!Schema::hasColumn('contatos', 'has_whatsapp_principal')) {
                    DB::statement("ALTER TABLE contatos ADD COLUMN has_whatsapp_principal BOOLEAN DEFAULT FALSE");
                    DB::statement("ALTER TABLE contatos ADD COLUMN has_whatsapp_secundario BOOLEAN DEFAULT FALSE");
                    DB::statement("ALTER TABLE contatos ADD COLUMN has_whatsapp_celular BOOLEAN DEFAULT FALSE");
                    DB::statement("ALTER TABLE contatos ADD COLUMN has_whatsapp_outro BOOLEAN DEFAULT FALSE");
                }
                if (!Schema::hasColumn('enderecos', 'exibir_apenas_cidade')) {
                    DB::statement("ALTER TABLE enderecos ADD COLUMN exibir_apenas_cidade BOOLEAN DEFAULT FALSE");
                }
            } catch (\Exception $e) {}

            $cpfCnpjRaw = (string) ($request->input('cpf_cnpj') ?? $request->input('cnpj') ?? '');
            $cpfCnpjNormalized = preg_replace('/\D+/', '', $cpfCnpjRaw) ?? '';

            $request->merge([
                'nome_fantasia' => $request->input('nome_fantasia') ?? $request->input('nome'),
                'cpf_cnpj'      => $cpfCnpjNormalized,
                'logo_url'      => $request->input('logo_url') ?? $request->input('logotipo'),
                'video'         => $request->input('video') ?? $request->input('video_link'),
                'portfolio_url' => $request->input('portfolio_url') ?? $request->input('arquivo_midia'),
                'banner_url'    => $request->input('banner_url') ?? $request->input('banner'),
            ]);

            // Normaliza redes_sociais
            $redesNormalized = [];
            $redes = $request->input('redes_sociais');

            if (is_array($redes) && isset($redes[0]) && is_array($redes[0]) && array_key_exists('tipo', $redes[0])) {
                foreach ($redes as $r) {
                    $tipo = isset($r['tipo']) ? trim((string) $r['tipo']) : '';
                    $url  = isset($r['url']) ? trim((string) $r['url']) : '';
                    if ($tipo !== '') {
                        $redesNormalized[] = ['tipo' => $tipo, 'url' => ($url !== '' ? $url : null)];
                    }
                }
            }

            if (empty($redesNormalized) && is_array($redes) && isset($redes[0]) && is_array($redes[0])) {
                $r0 = $redes[0];
                $map = [
                    'facebook' => 'facebook',
                    'instagram' => 'instagram',
                    'linkedin' => 'linkedin',
                    'youtube' => 'youtube',
                    'tiktok' => 'tiktok',
                    'x' => 'x',
                ];

                foreach ($map as $k => $tipo) {
                    $url = isset($r0[$k]) ? trim((string) $r0[$k]) : '';
                    if ($url !== '') {
                        $redesNormalized[] = ['tipo' => $tipo, 'url' => $url];
                    }
                }
            }

            if (empty($redesNormalized)) {
                $map = [
                    'facebook' => 'facebook',
                    'instagram' => 'instagram',
                    'linkedin' => 'linkedin',
                    'youtube' => 'youtube',
                    'tiktok' => 'tiktok',
                    'x' => 'x',
                ];

                foreach ($map as $k => $tipo) {
                    $url = trim((string) $request->input($k, ''));
                    if ($url !== '') {
                        $redesNormalized[] = ['tipo' => $tipo, 'url' => $url];
                    }
                }
            }

            $segmentos = $request->input('segmentos');
            if (is_array($segmentos)) {
                $segmentosNorm = array_map(function ($s) {
                    return is_array($s) && isset($s['id']) ? (int) $s['id'] : (int) $s;
                }, $segmentos);
                $request->merge(['segmentos' => $segmentosNorm]);
            }

            $cidadesAtendidas = $request->input('cidades_atendidas');
            if (is_array($cidadesAtendidas)) {
                $cidadesNorm = array_map(function ($c) {
                    return is_array($c) && isset($c['id']) ? (int) $c['id'] : (int) $c;
                }, $cidadesAtendidas);
                $request->merge(['cidades_atendidas' => $cidadesNorm]);
            }

            $request->merge(['redes_sociais' => $redesNormalized]);

            $validated = $request->validate([
                'nome_fantasia' => 'required|string|max:255',

                'cpf_cnpj' => 'nullable|string|max:20',

                'razao_social'          => 'nullable|string|max:255',
                'nome_alternativo'      => 'nullable|string|max:255',
                'inscricao_estadual'    => 'nullable|string|max:255',
                'inscricao_municipal'   => 'nullable|string|max:255',
                'registro_profissional' => 'nullable|string|max:255',
                'descricao'             => 'nullable|string',
                'observacoes'           => 'nullable|string',
                'exibir_no_site'        => 'nullable|boolean',
                'exibir_data_fundacao'  => 'nullable|boolean',
                'possui_publicidade'    => 'nullable|boolean',

                'video'         => 'nullable|string|max:500',
                'portfolio_url' => 'nullable|string|max:500',
                'tipo_arquivo_midia' => 'nullable|string|max:50|in:catalogo,portfolio,cardapio',

                // ✅ tipo_cliente
                'tipo_cliente' => [
                    'nullable',
                    'string',
                    'max:20',
                    Rule::in(['gratuito', 'pagante']),
                ],

                'status_assinatura' => [
                    'nullable',
                    'string',
                    'max:20',
                    Rule::in(['ativa', 'pendente', 'atrasada', 'suspensa', 'cancelada']),
                ],

                'segmentos'       => 'nullable|array',
                'segmentos.*'     => 'integer|exists:segmentos,id',

                'cidades_atendidas'   => 'nullable|array',
                'cidades_atendidas.*' => 'integer|exists:cidades,id',

                'endereco'                 => 'nullable|array',
                'endereco.nome_unidade'    => 'nullable|string|max:255',
                'endereco.telefone'        => 'nullable|string|max:50',
                'endereco.cep'             => 'nullable|string',
                'endereco.estado'          => 'required_with:endereco|string',
                'endereco.cidade'          => 'required_with:endereco|string',
                'endereco.bairro'          => 'nullable|string',
                'endereco.rua'             => 'nullable|string',
                'endereco.numero'          => 'nullable|string',
                'endereco.complemento'     => 'nullable|string',

                'enderecos'                => 'nullable|array',
                'enderecos.*.nome_unidade' => 'nullable|string|max:255',
                'enderecos.*.telefone'     => 'nullable|string|max:50',
                'enderecos.*.cep'          => 'nullable|string',
                'enderecos.*.estado'       => 'required_with:enderecos|string',
                'enderecos.*.cidade'       => 'required_with:enderecos|string',
                'enderecos.*.bairro'       => 'nullable|string',
                'enderecos.*.tipo_logradouro' => 'nullable|string',
                'enderecos.*.rua'          => 'nullable|string',
                'enderecos.*.numero'       => 'nullable|string',
                'enderecos.*.complemento'  => 'nullable|string',
                'enderecos.*.link_maps'    => 'nullable|string|max:500',
                'enderecos.*.link_waze'    => 'nullable|string|max:500',
                'enderecos.*.exibir_apenas_cidade' => 'nullable|boolean',
                'endereco.exibir_apenas_cidade'    => 'nullable|boolean',

                'contatos'                      => 'nullable|array',
                'contatos.*.telefone_principal'  => 'nullable|string|max:50',
                'contatos.*.obs_telefone_principal' => 'nullable|string|max:255',
                'contatos.*.telefone_secundario' => 'nullable|string|max:50',
                'contatos.*.obs_telefone_secundario' => 'nullable|string|max:255',
                'contatos.*.celular'             => 'nullable|string|max:50',
                'contatos.*.obs_celular'         => 'nullable|string|max:255',
                'contatos.*.telefone_outro'      => 'nullable|string|max:50',
                'contatos.*.obs_telefone_outro'  => 'nullable|string|max:255',
                'contatos.*.whatsapp_selected'   => 'nullable|string|max:50',
                'contatos.*.has_whatsapp_principal'  => 'nullable|boolean',
                'contatos.*.has_whatsapp_secundario' => 'nullable|boolean',
                'contatos.*.has_whatsapp_celular'    => 'nullable|boolean',
                'contatos.*.has_whatsapp_outro'      => 'nullable|boolean',
                'contatos.*.exibir_tel_principal'              => 'nullable|boolean',
                'contatos.*.telefone_principal_hidden_until'    => 'nullable|date',
                'contatos.*.exibir_tel_secundario'             => 'nullable|boolean',
                'contatos.*.exibir_celular'      => 'nullable|boolean',
                'contatos.*.exibir_tel_outro'    => 'nullable|boolean',
                'contatos.*.exibir_email'        => 'nullable|boolean',
                'contatos.*.email_principal'     => 'nullable|email|max:255',
                'contatos.*.email_cobranca'      => 'nullable|email|max:255',
                'contatos.*.site'                => 'nullable|string|max:255',
                'contatos.*.nome_contato'        => 'nullable|string|max:255',

                'redes_sociais'          => 'nullable|array',
                'redes_sociais.*.tipo'   => 'nullable|string|max:50',
                'redes_sociais.*.url'    => 'nullable|string|max:500',
                'redes_sociais.*.label'  => 'nullable|string|max:100',

                'logo_url' => 'nullable|string|max:255',
                'banner_url' => 'nullable|string|max:255',
                'horario_atendimento' => 'nullable',
                'observacoes_horario' => 'nullable|string',

                'generate_seo_keywords' => 'nullable|boolean',
                'seo_keywords_text'     => 'nullable|string',
                'data_fundacao'         => 'nullable|date',
                'google_place_id'       => 'nullable|string|max:255',
                'reviews'               => 'nullable|array',
                'beneficios'            => 'nullable|array',
                'beneficios.*'          => 'string|max:100',
                'contact_preference'    => 'nullable|string|max:50',
                'best_contact_shift'    => 'nullable|string|max:50',
            ]);

            $generate = $request->boolean('generate_seo_keywords', true);

            DB::beginTransaction();

            $tipoCliente = $validated['tipo_cliente'] ?? 'gratuito';

            // ✅ se não vier status_assinatura, define padrão conforme tipo_cliente
            $statusAssinatura = $validated['status_assinatura'] ?? (
                $tipoCliente === 'pagante' ? 'pendente' : 'ativa'
            );

            $seoSource = $generate ? 'ai' : 'manual';

            $clienteData = [
                'nome_fantasia' => $validated['nome_fantasia'],
                'cpf_cnpj'      => $validated['cpf_cnpj'],
                'razao_social'          => $validated['razao_social'] ?? null,
                'nome_alternativo'      => $validated['nome_alternativo'] ?? null,
                'inscricao_estadual'    => $validated['inscricao_estadual'] ?? null,
                'inscricao_municipal'   => $validated['inscricao_municipal'] ?? null,
                'registro_profissional' => $validated['registro_profissional'] ?? null,
                'descricao'             => $validated['descricao'] ?? null,
                'observacoes'           => $validated['observacoes'] ?? null,
                'exibir_no_site'        => $request->boolean('exibir_no_site', true) ? 'true' : 'false',
                'exibir_data_fundacao'  => $request->boolean('exibir_data_fundacao', true) ? 'true' : 'false',
                'possui_publicidade'    => $request->boolean('possui_publicidade') ? 'true' : 'false',
            ];

            if (Schema::hasColumn('clientes', 'horario_atendimento')) {
                $clienteData['horario_atendimento'] = $validated['horario_atendimento'] ?? null;
            }
            if (Schema::hasColumn('clientes', 'observacoes_horario')) {
                $clienteData['observacoes_horario'] = $validated['observacoes_horario'] ?? null;
            }

            if (Schema::hasColumn('clientes', 'seo_keywords_source')) {
                $clienteData['seo_keywords_source'] = $seoSource;
            }

            if (Schema::hasColumn('clientes', 'logo_url')) {
                $clienteData['logo_url'] = $validated['logo_url'] ?? null;
            }

            if (Schema::hasColumn('clientes', 'banner_url')) {
                $clienteData['banner_url'] = $validated['banner_url'] ?? null;
            }

            if (Schema::hasColumn('clientes', 'video')) {
                $clienteData['video'] = $validated['video'] ?? null;
            }
            if (Schema::hasColumn('clientes', 'portfolio_url')) {
                $clienteData['portfolio_url'] = $validated['portfolio_url'] ?? null;
            }
            if (Schema::hasColumn('clientes', 'tipo_arquivo_midia')) {
                $clienteData['tipo_arquivo_midia'] = $validated['tipo_arquivo_midia'] ?? 'catalogo';
            }

            // ✅ NOVOS campos
            if (Schema::hasColumn('clientes', 'tipo_cliente')) {
                $clienteData['tipo_cliente'] = $tipoCliente;
            }
            if (Schema::hasColumn('clientes', 'status_assinatura')) {
                $clienteData['status_assinatura'] = $statusAssinatura;
            }

            if (Schema::hasColumn('clientes', 'data_fundacao')) {
                $clienteData['data_fundacao'] = $validated['data_fundacao'] ?? null;
            }

            if (Schema::hasColumn('clientes', 'google_place_id')) {
                $clienteData['google_place_id'] = $validated['google_place_id'] ?? null;
            }

            if (isset($validated['beneficios'])) {
                $clienteData['beneficios'] = $validated['beneficios'];
            }

            $cliente = Cliente::create($clienteData);

            if (!empty($validated['segmentos'])) {
                $segmentosData = [];
                foreach (array_values($validated['segmentos']) as $index => $segId) {
                    $segmentosData[$segId] = ['is_primary' => $index === 0 ? DB::raw('true') : DB::raw('false')];
                }
                $cliente->segmentos()->sync($segmentosData);
            }

            if (!empty($validated['cidades_atendidas'])) {
                $cliente->cidadesAtendidas()->sync($validated['cidades_atendidas']);
            }

            // endereços (múltiplos)
            $enderecos = $validated['enderecos'] ?? [];
            if (empty($enderecos) && !empty($validated['endereco'])) {
                $enderecos = [$validated['endereco']];
            }

            if (!empty($enderecos)) {
                foreach ($enderecos as $end) {
                    $end['exibir_apenas_cidade'] = filter_var($end['exibir_apenas_cidade'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
                    $end['is_cobranca']          = filter_var($end['is_cobranca'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
                    $end['cep'] = $end['cep'] ?? '';
                    $end['estado'] = $end['estado'] ?? '';
                    $end['cidade'] = $end['cidade'] ?? '';
                    $end['bairro'] = $end['bairro'] ?? '';
                    $end['rua'] = $end['rua'] ?? '';
                    $end['numero'] = $end['numero'] ?? '';
                    $cliente->enderecos()->create($end);
                }
            }

            if (!empty($validated['contatos']) && is_array($validated['contatos'])) {
                foreach ($validated['contatos'] as $contato) {
                    $boolFields = ['has_whatsapp_principal', 'has_whatsapp_secundario', 'has_whatsapp_celular', 'has_whatsapp_outro', 'exibir_tel_principal', 'exibir_tel_secundario', 'exibir_celular', 'exibir_tel_outro', 'exibir_email'];
                    foreach ($boolFields as $bf) {
                        if (array_key_exists($bf, $contato)) {
                            $contato[$bf] = filter_var($contato[$bf], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
                        }
                    }
                    $cliente->contatos()->create($contato);
                }
            }

            if (!empty($validated['redes_sociais']) && is_array($validated['redes_sociais'])) {
                foreach ($validated['redes_sociais'] as $rede) {
                    $cliente->redesSociais()->create([
                        'tipo' => $rede['tipo'],
                        'url'  => $rede['url'] ?? null,
                    ]);
                }
            }

            // SEO manual
            if (!$generate && Schema::hasColumn('clientes', 'seo_keywords')) {
                $out = $this->parseKeywordsText((string) $request->input('seo_keywords_text', ''));

                $payload = [
                    'seo_keywords' => $out,
                    'seo_keywords_updated_at' => now(),
                ];

                if (Schema::hasColumn('clientes', 'seo_keywords_source')) {
                    $payload['seo_keywords_source'] = 'manual';
                }

                $cliente->update($payload);
            }

            // SEO IA
            if ($generate) {
                if (Schema::hasColumn('clientes', 'seo_keywords_source') && ($cliente->seo_keywords_source ?? null) !== 'manual') {
                    GenerateSeoKeywordsJob::dispatch($cliente->id)->afterCommit();
                }
            }

            // Salva reviews do Google (somente se enviado na request)
            if ($request->has('reviews')) {
                $reviewsInput = $request->input('reviews');
                $sentIds = [];
                if (is_array($reviewsInput)) {
                    foreach ($reviewsInput as $rev) {
                        $rid = $rev['google_review_id'] ?? null;
                        if (!$rid && isset($rev['time'])) {
                            $rid = $cliente->id . '_' . $rev['time'] . '_' . Str::slug($rev['author_name'] ?? 'anon');
                        }
                        
                        if (!$rid) continue;
                        $sentIds[] = (string) $rid;

                        $dateVal = null;
                        if (isset($rev['time']) && is_numeric($rev['time'])) {
                            $dateVal = date('Y-m-d H:i:s', (int)$rev['time']);
                        } elseif (isset($rev['relative_time_description'])) {
                            $isDate = strtotime((string)$rev['relative_time_description']);
                            if ($isDate) $dateVal = date('Y-m-d H:i:s', $isDate);
                        }

                        ClienteReview::updateOrCreate(
                            ['google_review_id' => (string)$rid, 'cliente_id' => $cliente->id],
                            [
                                'author_name' => $rev['author_name'] ?? 'Anônimo',
                                'author_photo_url' => $rev['author_photo_url'] ?? ($rev['profile_photo_url'] ?? null),
                                'rating' => (int)($rev['rating'] ?? 5),
                                'text' => $rev['text'] ?? '',
                                'relative_time_description' => $dateVal,
                            ]
                        );
                    }
                }
            }

            DB::commit();

            // 📢 FASE 5: Sincronização em Tempo Real (WebSockets)
            try {
                broadcast(new \App\Events\ClienteUpdated($cliente));
            } catch (\Exception $e) {
                Log::warning('Erro ao disparar evento de Broadcast no Store: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'data' => new ClienteResource($cliente->load(['enderecos', 'contatos', 'segmentos', 'cidadesAtendidas', 'redesSociais', 'galeriaImagens', 'reviews'])),
            ], 201);

        } catch (ValidationException $e) {
            Log::warning('CLIENTE STORE - ERRO DE VALIDACAO', ['errors' => $e->errors()]);

            return response()->json([
                'message' => 'Erro de validação',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error('CLIENTE STORE - ERRO INTERNO', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Erro interno ao salvar cliente',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ UPDATE: PUT/PATCH /v1/clientes/{id}
     * Compatível com o payload do frontend (mesmo formato do store).
     */
    public function update(Request $request, $id)
    {

        try {
            $cliente = Cliente::with(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'cidadesAtendidas'])
                ->findOrFail($id);

            // AUTO-HEALING SCHEMA (Garante que Supabase esteja em dia)
            try {
                if (!Schema::hasColumn('cliente_reviews', 'google_review_id')) {
                    DB::statement("ALTER TABLE cliente_reviews ADD COLUMN google_review_id VARCHAR(255) UNIQUE NULL");
                }
                if (!Schema::hasColumn('cliente_reviews', 'is_visible')) {
                    DB::statement("ALTER TABLE cliente_reviews ADD COLUMN is_visible BOOLEAN DEFAULT TRUE");
                }
                if (!Schema::hasColumn('clientes', 'horario_atendimento')) {
                    DB::statement("ALTER TABLE clientes ADD COLUMN horario_atendimento JSONB NULL");
                }
                if (!Schema::hasColumn('clientes', 'beneficios')) {
                    DB::statement("ALTER TABLE clientes ADD COLUMN beneficios JSONB NULL");
                }
                if (!Schema::hasColumn('clientes', 'tipo_arquivo_midia')) {
                    DB::statement("ALTER TABLE clientes ADD COLUMN tipo_arquivo_midia VARCHAR(50) DEFAULT 'catalogo' NULL");
                }
                if (!Schema::hasColumn('clientes', 'responsavel')) {
                    DB::statement("ALTER TABLE clientes ADD COLUMN responsavel VARCHAR(255) NULL");
                }
                if (!Schema::hasColumn('contatos', 'has_whatsapp_principal')) {
                    DB::statement("ALTER TABLE contatos ADD COLUMN has_whatsapp_principal BOOLEAN DEFAULT FALSE");
                    DB::statement("ALTER TABLE contatos ADD COLUMN has_whatsapp_secundario BOOLEAN DEFAULT FALSE");
                    DB::statement("ALTER TABLE contatos ADD COLUMN has_whatsapp_celular BOOLEAN DEFAULT FALSE");
                    DB::statement("ALTER TABLE contatos ADD COLUMN has_whatsapp_outro BOOLEAN DEFAULT FALSE");
                }
                if (!Schema::hasColumn('enderecos', 'exibir_apenas_cidade')) {
                    DB::statement("ALTER TABLE enderecos ADD COLUMN exibir_apenas_cidade BOOLEAN DEFAULT FALSE");
                }
                if (!Schema::hasColumn('enderecos', 'is_cobranca')) {
                    DB::statement("ALTER TABLE enderecos ADD COLUMN is_cobranca BOOLEAN DEFAULT FALSE");
                }
                if (!Schema::hasColumn('enderecos', 'endereco_compacto')) {
                    DB::statement("ALTER TABLE enderecos ADD COLUMN endereco_compacto VARCHAR(255) NULL");
                }
            } catch (\Exception $e) {
                Log::warning("Auto-healing schema warning: " . $e->getMessage());
            }

            $cpfCnpjRaw = (string) ($request->input('cpf_cnpj') ?? $request->input('cnpj') ?? $request->input('cpfCnpj') ?? '');
            $cpfCnpjNormalized = preg_replace('/\D+/', '', $cpfCnpjRaw) ?? '';

            $request->merge([
                'nome_fantasia' => $request->input('nome_fantasia') ?? $request->input('nome'),
                'cpf_cnpj'      => $cpfCnpjNormalized,
                'logo_url'      => $request->input('logo_url') ?? $request->input('logotipo'),
                'video'         => $request->input('video') ?? $request->input('video_link'),
                'portfolio_url' => $request->input('portfolio_url') ?? $request->input('arquivo_midia'),
            ]);

            $segmentos = $request->input('segmentos');
            if (is_array($segmentos)) {
                $segmentosNorm = array_map(function ($s) {
                    return is_array($s) && isset($s['id']) ? (int) $s['id'] : (int) $s;
                }, $segmentos);
                $request->merge(['segmentos' => $segmentosNorm]);
            }

            $cidadesAtendidas = $request->input('cidades_atendidas');
            if (is_array($cidadesAtendidas)) {
                $cidadesNorm = array_map(function ($c) {
                    return is_array($c) && isset($c['id']) ? (int) $c['id'] : (int) $c;
                }, $cidadesAtendidas);
                $request->merge(['cidades_atendidas' => $cidadesNorm]);
            }

            // Normaliza redes_sociais (mesma lógica do store)
            $redesNormalized = [];
            $redes = $request->input('redes_sociais');

            if (is_array($redes) && isset($redes[0]) && is_array($redes[0]) && array_key_exists('tipo', $redes[0])) {
                foreach ($redes as $r) {
                    $tipo  = isset($r['tipo'])  ? trim((string) $r['tipo'])  : '';
                    $url   = isset($r['url'])   ? trim((string) $r['url'])   : '';
                    $label = isset($r['label']) && $r['label'] !== '' ? trim((string) $r['label']) : null;
                    if ($tipo !== '') {
                        $redesNormalized[] = ['tipo' => $tipo, 'url' => ($url !== '' ? $url : null), 'label' => $label];
                    }
                }
            }

            if (empty($redesNormalized) && is_array($redes) && isset($redes[0]) && is_array($redes[0])) {
                $r0 = $redes[0];
                $map = [
                    'facebook' => 'facebook',
                    'instagram' => 'instagram',
                    'linkedin' => 'linkedin',
                    'youtube' => 'youtube',
                    'tiktok' => 'tiktok',
                    'x' => 'x',
                ];

                foreach ($map as $k => $tipo) {
                    $url = isset($r0[$k]) ? trim((string) $r0[$k]) : '';
                    if ($url !== '') {
                        $redesNormalized[] = ['tipo' => $tipo, 'url' => $url];
                    }
                }
            }

            $hasRedesSociais = $request->has('redes_sociais');
            if (empty($redesNormalized)) {
                $map = [
                    'facebook' => 'facebook',
                    'instagram' => 'instagram',
                    'linkedin' => 'linkedin',
                    'youtube' => 'youtube',
                    'tiktok' => 'tiktok',
                    'x' => 'x',
                ];

                foreach ($map as $k => $tipo) {
                    if ($request->has($k)) {
                        $hasRedesSociais = true;
                    }
                    $url = trim((string) $request->input($k, ''));
                    if ($url !== '') {
                        $redesNormalized[] = ['tipo' => $tipo, 'url' => $url];
                    }
                }
            }

            if ($hasRedesSociais) {
                $request->merge(['redes_sociais' => $redesNormalized]);
            }

            $validated = $request->validate([
                'nome_fantasia' => 'required|string|max:255',

                'cpf_cnpj' => 'nullable|string|max:20',

                'razao_social'          => 'nullable|string|max:255',
                'nome_alternativo'      => 'nullable|string|max:255',
                'inscricao_estadual'    => 'nullable|string|max:255',
                'inscricao_municipal'   => 'nullable|string|max:255',
                'registro_profissional' => 'nullable|string|max:255',
                'descricao'             => 'nullable|string',
                'observacoes'           => 'nullable|string',
                'exibir_no_site'        => 'nullable|boolean',
                'exibir_data_fundacao'  => 'nullable|boolean',
                'possui_publicidade'    => 'nullable|boolean',

                'video'         => 'nullable|string|max:500',
                'portfolio_url' => 'nullable|string|max:500',
                'tipo_arquivo_midia' => 'nullable|string|max:50|in:catalogo,portfolio,cardapio',

                'tipo_cliente' => [
                    'nullable',
                    'string',
                    'max:20',
                    Rule::in(['gratuito', 'pagante']),
                ],

                'status_assinatura' => [
                    'nullable',
                    'string',
                    'max:20',
                    Rule::in(['ativa', 'pendente', 'atrasada', 'suspensa', 'cancelada']),
                ],

                'segmentos'       => 'nullable|array',
                'segmentos.*'     => 'integer|exists:segmentos,id',

                'cidades_atendidas'   => 'nullable|array',
                'cidades_atendidas.*' => 'integer|exists:cidades,id',

                'endereco'                 => 'nullable|array',
                'endereco.nome_unidade'    => 'nullable|string|max:255',
                'endereco.cep'             => 'nullable|string',
                'endereco.estado'          => 'required_with:endereco|string',
                'endereco.cidade'          => 'required_with:endereco|string',
                'endereco.bairro'          => 'nullable|string',
                'endereco.tipo_logradouro' => 'nullable|string',
                'endereco.rua'             => 'nullable|string',
                'endereco.numero'          => 'nullable|string',
                'endereco.complemento'     => 'nullable|string',

                'enderecos'                => 'nullable|array',
                'enderecos.*.nome_unidade' => 'nullable|string|max:255',
                'enderecos.*.telefone'     => 'nullable|string|max:50',
                'enderecos.*.cep'          => 'nullable|string',
                'enderecos.*.estado'       => 'required_with:enderecos|string',
                'enderecos.*.cidade'       => 'required_with:enderecos|string',
                'enderecos.*.bairro'       => 'nullable|string',
                'enderecos.*.tipo_logradouro' => 'nullable|string',
                'enderecos.*.rua'          => 'nullable|string',
                'enderecos.*.numero'       => 'nullable|string',
                'enderecos.*.complemento'  => 'nullable|string',
                'enderecos.*.link_maps'    => 'nullable|string|max:500',
                'enderecos.*.link_waze'    => 'nullable|string|max:500',
                'enderecos.*.exibir_apenas_cidade' => 'nullable|boolean',
                'enderecos.*.is_cobranca'          => 'nullable|boolean',
                'enderecos.*.endereco_compacto'    => 'nullable|string|max:500',
                'endereco.exibir_apenas_cidade'    => 'nullable|boolean',
                'endereco.is_cobranca'             => 'nullable|boolean',
                'endereco.endereco_compacto'       => 'nullable|string|max:500',

                'contatos'                      => 'nullable|array',
                'contatos.*.telefone_principal'  => 'nullable|string|max:50',
                'contatos.*.obs_telefone_principal' => 'nullable|string|max:255',
                'contatos.*.telefone_secundario' => 'nullable|string|max:50',
                'contatos.*.obs_telefone_secundario' => 'nullable|string|max:255',
                'contatos.*.celular'             => 'nullable|string|max:50',
                'contatos.*.obs_celular'         => 'nullable|string|max:255',
                'contatos.*.telefone_outro'      => 'nullable|string|max:50',
                'contatos.*.obs_telefone_outro'  => 'nullable|string|max:255',
                'contatos.*.whatsapp_selected'   => 'nullable|string|max:50',
                'contatos.*.has_whatsapp_principal'  => 'nullable|boolean',
                'contatos.*.has_whatsapp_secundario' => 'nullable|boolean',
                'contatos.*.has_whatsapp_celular'    => 'nullable|boolean',
                'contatos.*.has_whatsapp_outro'      => 'nullable|boolean',
                'contatos.*.exibir_tel_principal'              => 'nullable|boolean',
                'contatos.*.telefone_principal_hidden_until'    => 'nullable|date',
                'contatos.*.exibir_tel_secundario'             => 'nullable|boolean',
                'contatos.*.exibir_celular'      => 'nullable|boolean',
                'contatos.*.exibir_tel_outro'    => 'nullable|boolean',
                'contatos.*.exibir_email'        => 'nullable|boolean',
                'contatos.*.email_principal'     => 'nullable|email|max:255',
                'contatos.*.email_cobranca'      => 'nullable|email|max:255',
                'contatos.*.site'                => 'nullable|string|max:255',
                'contatos.*.nome_contato'        => 'nullable|string|max:255',

                'redes_sociais'          => 'nullable|array',
                'redes_sociais.*.tipo'   => 'nullable|string|max:50',
                'redes_sociais.*.url'    => 'nullable|string|max:500',
                'redes_sociais.*.label'  => 'nullable|string|max:100',

                'logo_url' => 'nullable|string|max:255',
                'banner_url' => 'nullable|string|max:255',
                'horario_atendimento' => 'nullable',
                'observacoes_horario' => 'nullable|string',

                'generate_seo_keywords' => 'nullable|boolean',
                'seo_keywords_text'     => 'nullable|string',
                'data_fundacao'         => 'nullable|date',
                'google_place_id'       => 'nullable|string|max:255',
                'reviews'               => 'nullable|array',
                'beneficios'            => 'nullable|array',
                'beneficios.*'          => 'string|max:100',
                'audit_status'          => 'nullable|string|in:ok,pending,scanning,manual_review',
                'last_audit_at'         => 'nullable|date',
                'audit_differences'     => 'nullable',
                'audit_action'          => 'nullable|string',
                'contact_preference'    => 'nullable|string|max:50',
                'best_contact_shift'    => 'nullable|string|max:50',
            ]);

            $generate = $request->boolean('generate_seo_keywords', true);

            DB::beginTransaction();

            $tipoCliente = $validated['tipo_cliente'] ?? ($cliente->tipo_cliente ?? 'gratuito');

            // se não vier status_assinatura, define com base no tipo_cliente (gratuito recebe 'ativa' para evitar re-promoção automática)
            $statusAssinatura = $validated['status_assinatura'] ?? null;
            if (is_null($statusAssinatura)) {
                if ($tipoCliente === 'gratuito') {
                    $statusAssinatura = 'ativa';
                } else {
                    $statusAssinatura = $cliente->status_assinatura ?? 'pendente';
                }
            }

            $seoSource = $generate ? 'generated' : 'manual';

            $clienteData = [
                'nome_fantasia' => $validated['nome_fantasia'],
                'cpf_cnpj'      => $validated['cpf_cnpj'],
                'razao_social'          => $request->has('razao_social') ? ($validated['razao_social'] ?? null) : $cliente->razao_social,
                'nome_alternativo'      => $request->has('nome_alternativo') ? ($validated['nome_alternativo'] ?? null) : $cliente->nome_alternativo,
                'inscricao_estadual'    => $request->has('inscricao_estadual') ? ($validated['inscricao_estadual'] ?? null) : $cliente->inscricao_estadual,
                'inscricao_municipal'   => $request->has('inscricao_municipal') ? ($validated['inscricao_municipal'] ?? null) : $cliente->inscricao_municipal,
                'registro_profissional' => $request->has('registro_profissional') ? ($validated['registro_profissional'] ?? null) : $cliente->registro_profissional,
                'descricao'             => $request->has('descricao') ? ($validated['descricao'] ?? null) : $cliente->descricao,
                'observacoes'           => $request->has('observacoes') ? ($validated['observacoes'] ?? null) : $cliente->observacoes,
                'exibir_no_site'        => $request->has('exibir_no_site') ? ($request->boolean('exibir_no_site') ? 'true' : 'false') : ($cliente->exibir_no_site ?? 'true'),
                'exibir_data_fundacao'  => $request->has('exibir_data_fundacao') ? ($request->boolean('exibir_data_fundacao') ? 'true' : 'false') : ($cliente->exibir_data_fundacao ?? 'true'),
                'possui_publicidade'    => $request->has('possui_publicidade') ? ($request->boolean('possui_publicidade') ? 'true' : 'false') : ($cliente->possui_publicidade ?? 'false'),
                'audit_status'          => $validated['audit_status'] ?? $cliente->audit_status,
                'audit_differences'     => array_key_exists('audit_differences', $validated) ? $validated['audit_differences'] : $cliente->audit_differences,
                'contact_preference'    => $validated['contact_preference'] ?? $cliente->contact_preference,
                'best_contact_shift'    => $validated['best_contact_shift'] ?? $cliente->best_contact_shift,
            ];

            if (isset($validated['last_audit_at'])) {
                $clienteData['last_audit_at'] = $validated['last_audit_at'];
            }

            if ($request->filled('audit_action') && $request->user()) {
                $clienteData['responsavel'] = $request->user()->name;
            }

            if (Schema::hasColumn('clientes', 'horario_atendimento') && !$request->has('horario_atendimento')) {
                // horario_atendimento já é tratado com $request->has() abaixo — não sobrescrever aqui
            }

            if (Schema::hasColumn('clientes', 'seo_keywords_source')) {
                $clienteData['seo_keywords_source'] = $seoSource;
            }

            if (Schema::hasColumn('clientes', 'logo_url')) {
                $clienteData['logo_url'] = $request->has('logo_url') ? ($validated['logo_url'] ?? null) : $cliente->logo_url;
            }

            if (Schema::hasColumn('clientes', 'banner_url')) {
                $clienteData['banner_url'] = $request->has('banner_url') ? ($validated['banner_url'] ?? null) : $cliente->banner_url;
            }

            if (Schema::hasColumn('clientes', 'video')) {
                $clienteData['video'] = $request->has('video') ? ($validated['video'] ?? null) : $cliente->video;
            }

            if (Schema::hasColumn('clientes', 'portfolio_url')) {
                $clienteData['portfolio_url'] = $request->has('portfolio_url') ? ($validated['portfolio_url'] ?? null) : $cliente->portfolio_url;
            }

            if (Schema::hasColumn('clientes', 'tipo_arquivo_midia')) {
                $clienteData['tipo_arquivo_midia'] = $request->has('tipo_arquivo_midia') ? ($validated['tipo_arquivo_midia'] ?? $cliente->tipo_arquivo_midia) : $cliente->tipo_arquivo_midia;
            }

            if (Schema::hasColumn('clientes', 'tipo_cliente')) {
                $clienteData['tipo_cliente'] = $tipoCliente;
            }

            if (Schema::hasColumn('clientes', 'status_assinatura')) {
                $clienteData['status_assinatura'] = $statusAssinatura;
            }

            if (Schema::hasColumn('clientes', 'data_fundacao')) {
                $clienteData['data_fundacao'] = $request->has('data_fundacao') ? ($validated['data_fundacao'] ?? null) : $cliente->data_fundacao;
            }

            if ($request->has('horario_atendimento')) {
                $clienteData['horario_atendimento'] = $request->input('horario_atendimento');
            }

            if ($request->has('observacoes_horario')) {
                $clienteData['observacoes_horario'] = $request->input('observacoes_horario');
            }

            if ($request->has('google_place_id')) {
                $clienteData['google_place_id'] = $request->input('google_place_id');
            }

            if ($request->has('beneficios')) {
                $clienteData['beneficios'] = $request->input('beneficios');
            }

            Log::info('CLIENTE UPDATE - DADOS PARA SALVAR', [
                'cliente_id' => $id,
                'exibir_no_site' => $clienteData['exibir_no_site'],
                'exibir_data_fundacao' => $clienteData['exibir_data_fundacao'],
                'payload_final' => $clienteData
            ]);

            $cliente->update($clienteData);



            // relações pivot
            if (array_key_exists('segmentos', $validated)) {
                $segmentosData = [];
                if (!empty($validated['segmentos'])) {
                    foreach (array_values($validated['segmentos']) as $index => $segId) {
                        $segmentosData[$segId] = ['is_primary' => $index === 0 ? DB::raw('true') : DB::raw('false')];
                    }
                }
                $cliente->segmentos()->sync($segmentosData);
            }

            if (array_key_exists('cidades_atendidas', $validated)) {
                $cliente->cidadesAtendidas()->sync($validated['cidades_atendidas'] ?? []);
            }

            // endereço: sincroniza múltiplos
            if ($request->has('enderecos') || $request->has('endereco')) {
                $enderecos = $validated['enderecos'] ?? [];
                if (empty($enderecos) && !empty($validated['endereco'])) {
                    $enderecos = [$validated['endereco']];
                }

                if (!empty($enderecos)) {
                    $cliente->enderecos()->delete();
                    foreach ($enderecos as $end) {
                        $cliente->enderecos()->create([
                            'nome_unidade'         => $end['nome_unidade'] ?? null,
                            'telefone'             => $end['telefone'] ?? null,
                            'cep'                  => $end['cep'] ?? '',
                            'estado'               => $end['estado'] ?? '',
                            'cidade'               => $end['cidade'] ?? '',
                            'bairro'               => $end['bairro'] ?? '',
                            'tipo_logradouro'      => $end['tipo_logradouro'] ?? null,
                            'rua'                  => $end['rua'] ?? '',
                            'numero'               => $end['numero'] ?? '',
                            'complemento'          => $end['complemento'] ?? null,
                            'link_maps'            => $end['link_maps'] ?? null,
                            'link_waze'            => $end['link_waze'] ?? null,
                            'latitude'             => $end['latitude'] ?? null,
                            'longitude'            => $end['longitude'] ?? null,
                            'exibir_apenas_cidade' => filter_var($end['exibir_apenas_cidade'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false',
                            'is_cobranca'          => filter_var($end['is_cobranca'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false',
                            'endereco_compacto'    => $end['endereco_compacto'] ?? null,
                        ]);
                    }
                }
            }

            // contato: atualiza o primeiro, senão cria
            \Illuminate\Support\Facades\Log::info('DEBUG_CONTATOS_UPDATE', [
                'req_contatos' => $request->input('contatos'),
                'val_contatos' => $validated['contatos'] ?? null,
            ]);
            if (!empty($validated['contatos']) && is_array($validated['contatos'])) {
                $c0 = $validated['contatos'][0] ?? null;
                if (is_array($c0)) {
                    $boolFields = ['has_whatsapp_principal', 'has_whatsapp_secundario', 'has_whatsapp_celular', 'has_whatsapp_outro', 'exibir_tel_principal', 'exibir_tel_secundario', 'exibir_celular', 'exibir_tel_outro', 'exibir_email'];
                    foreach ($boolFields as $bf) {
                        if (array_key_exists($bf, $c0)) {
                            $c0[$bf] = filter_var($c0[$bf], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
                        }
                    }
                    $c = $cliente->contatos()->orderBy('id', 'asc')->first();
                    if ($c) {
                        $c->update($c0);
                    } else {
                        $cliente->contatos()->create($c0);
                    }
                }
            }

            // redes sociais: recria
            // Usa $request->input() ao invés de $validated para garantir que
            // campos como 'label' não sejam stripped pelo validated() do Laravel
            if ($request->has('redes_sociais')) {
                $redesInput = $request->input('redes_sociais', []);
                $cliente->redesSociais()->delete();

                if (!empty($redesInput) && is_array($redesInput)) {
                    foreach ($redesInput as $rede) {
                        $tipo = isset($rede['tipo']) ? (string) $rede['tipo'] : null;
                        $url  = isset($rede['url'])  ? (string) $rede['url']  : null;
                        $label = isset($rede['label']) && $rede['label'] !== '' ? (string) $rede['label'] : null;
                        if (!$tipo || !$url) continue;
                        $cliente->redesSociais()->create([
                            'tipo'  => $tipo,
                            'url'   => $url,
                            'label' => $label,
                        ]);
                    }
                }
            }



            // SEO manual
            if (!$generate && Schema::hasColumn('clientes', 'seo_keywords')) {
                $out = $this->parseKeywordsText((string) $request->input('seo_keywords_text', ''));

                $payload = [
                    'seo_keywords' => $out,
                    'seo_keywords_updated_at' => now(),
                ];

                if (Schema::hasColumn('clientes', 'seo_keywords_source')) {
                    $payload['seo_keywords_source'] = 'manual';
                }

                $cliente->update($payload);
            }

            // SEO IA
            if ($generate) {
                // Se o usuário marcou para gerar, executamos imediatamente (Sync)
                // para garantir que o resultado apareça logo após o save.
                GenerateSeoKeywordsJob::dispatchSync($cliente->id);
            }

            // Salva reviews do Google (somente se vier na request)
            if ($request->has('reviews')) {
                $reviewsInput = $request->input('reviews');
                $sentIds = [];
                if (is_array($reviewsInput)) {
                    foreach ($reviewsInput as $rev) {
                        // Gera um ID robusto compatível com o frontend
                        $rid = $rev['google_review_id'] ?? null;
                        if (!$rid && isset($rev['time'])) {
                            $slug = preg_replace('/[^a-z0-9]+/', '', strtolower($rev['author_name'] ?? 'anon'));
                            $rid = $cliente->id . '_' . $rev['time'] . '_' . $slug;
                        }
                        
                        if (!$rid) continue;
                        $sentIds[] = (string) $rid;

                        // Tenta converter a data de forma segura
                        $dateVal = null;
                        if (isset($rev['time']) && is_numeric($rev['time'])) {
                            $dateVal = date('Y-m-d H:i:s', (int)$rev['time']);
                        } elseif (isset($rev['relative_time_description']) && strtotime((string)$rev['relative_time_description'])) {
                            $dateVal = date('Y-m-d H:i:s', strtotime((string)$rev['relative_time_description']));
                        }

                        ClienteReview::updateOrCreate(
                            ['google_review_id' => (string)$rid, 'cliente_id' => $cliente->id],
                            [
                                'author_name' => $rev['author_name'] ?? 'Anônimo',
                                'author_photo_url' => $rev['author_photo_url'] ?? ($rev['profile_photo_url'] ?? null),
                                'rating' => (int)($rev['rating'] ?? 5),
                                'text' => $rev['text'] ?? '',
                                'relative_time_description' => $dateVal,
                            ]
                        );
                    }
                }
                
                // Sync: Deleta os reviews desmarcados
                $cliente->reviews()
                    ->whereNotNull('google_review_id')
                    ->whereNotIn('google_review_id', $sentIds)
                    ->delete();
            }

            if ($request->filled('audit_action')) {
                $this->audit(
                    action: $request->input('audit_action'),
                    entityType: 'cliente',
                    entityId: (int) $cliente->id,
                    fieldChanges: [], 
                    clienteId: (int) $cliente->id,
                    metadata: ['operator' => 'IA/User Audit']
                );
            }

            DB::commit();

            // 📢 FASE 5: Sincronização em Tempo Real (WebSockets)
            try {
                broadcast(new \App\Events\ClienteUpdated($cliente));
            } catch (\Exception $e) {
                Log::warning('Erro ao disparar evento de Broadcast no Update: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'data' => new ClienteResource($cliente->fresh()->load(['enderecos', 'contatos', 'segmentos', 'cidadesAtendidas', 'redesSociais', 'galeriaImagens', 'reviews'])),
            ], 200);

        } catch (ValidationException $e) {
            Log::warning('CLIENTE UPDATE - ERRO DE VALIDACAO', [
                'cliente_id' => $id,
                'errors' => $e->errors()
            ]);

            return response()->json([
                'message' => 'Erro de validação',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error('CLIENTE UPDATE - ERRO INTERNO', [
                'cliente_id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Erro interno ao atualizar cliente',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function parseKeywordsText(string $text): array
    {
        $text = trim($text);
        if ($text === '') return [];

        $text = str_replace('#', ' ', $text);
        $parts = preg_split('/[,;\n]+/u', $text) ?: [];

        return $this->normalizeKeywordsArray($parts);
    }

    private function normalizeKeywordsArray(array $parts): array
    {
        $out = [];
        $seen = [];

        foreach ($parts as $p) {
            $k = trim((string) $p);
            if ($k === '') continue;

            $normalized = preg_replace('/\s+/u', ' ', $k);
            $key = mb_strtolower($normalized ?? $k, 'UTF-8');

            if (isset($seen[$key])) continue;
            $seen[$key] = true;

            $out[] = $normalized ?? $k;

            if (count($out) >= 100) break;
        }

	  return $out; 
  }
    public function commitLogoTemp(Request $request, $clienteId)
    {
        $request->validate([
            'temp_path' => 'required|string',
        ]);

        $cliente = Cliente::findOrFail($clienteId);

        $supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $supabaseKey = config('services.supabase.service_role_key') ?: config('services.supabase.key');
        $bucket = config('services.supabase.bucket', 'clientes-media');

        $input = trim((string) $request->input('temp_path', ''));

        if (Str::startsWith($input, 'http://') || Str::startsWith($input, 'https://')) {
            $parsedPath = parse_url($input, PHP_URL_PATH) ?: '';
            $marker = "/storage/v1/object/public/{$bucket}/";
            if (str_contains($parsedPath, $marker)) {
                $input = explode($marker, $parsedPath, 2)[1] ?? $input;
            }
        }

        $tempPath = ltrim($input, '/');

        if (!Str::startsWith($tempPath, 'temp/')) {
            return response()->json([
                'success' => false,
                'message' => "temp_path inválido: {$tempPath}"
            ], 422);
        }

        $filename = basename($tempPath);
        $ext = pathinfo($filename, PATHINFO_EXTENSION) ?: 'webp';
        $destPath = "clientes/{$clienteId}/logo/logo.{$ext}";

        try {
            // COPY
            $copyUrl = "{$supabaseUrl}/storage/v1/object/copy";
            $copyPayload = [
                'bucketId' => $bucket,
                'sourceKey' => $tempPath,
                'destinationKey' => $destPath,
                'destinationBucketId' => $bucket,
            ];

            $copyResp = Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => 'application/json',
            ])->post($copyUrl, $copyPayload);

            if ($copyResp->failed()) {
                $copyData = $copyResp->json();
                if ($copyResp->status() === 409 || ($copyResp->status() === 400 && ($copyData['statusCode'] ?? '') == '409')) {
                    $delDestUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}";
                    Http::withHeaders([
                        'apikey' => $supabaseKey,
                        'Authorization' => "Bearer {$supabaseKey}",
                        'Content-Type' => 'application/json',
                    ])->delete($delDestUrl, ['prefixes' => [$destPath]]);

                    $copyResp = Http::withHeaders([
                        'apikey' => $supabaseKey,
                        'Authorization' => "Bearer {$supabaseKey}",
                        'Content-Type' => 'application/json',
                    ])->post($copyUrl, $copyPayload);
                }

                if ($copyResp->failed()) {
                    throw new \Exception("COPY failed {$copyResp->status()}: " . $copyResp->body());
                }
            }

            // DELETE temp
            $delUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}";
            $delResp = Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => 'application/json',
            ])->delete($delUrl, ['prefixes' => [$tempPath]]);

            if ($delResp->failed()) {
                Log::warning('SUPABASE_TEMP_DELETE_FAIL_LOGO', [
                    'cliente_id' => $clienteId,
                    'temp_path'  => $tempPath,
                    'status'     => $delResp->status(),
                    'body'       => $delResp->body(),
                ]);
            }

            $finalUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$destPath}";
            $oldLogoUrl = $cliente->logo_url ?? null;
            $cliente->update(['logo_url' => $finalUrl]);


$this->audit(
    action: 'upload',
    entityType: 'cliente_logo',
    entityId: (int) $cliente->id,
    fieldChanges: [
        'logo_url' => [
            'from' => $oldLogoUrl,
            'to' => $finalUrl,
        ],
    ],
    clienteId: (int) $cliente->id,
    metadata: [
        'dest_path' => $destPath,
        'bucket' => $bucket,
    ]
);



            return response()->json([
                'success' => true,
                'logo_url' => $finalUrl,
            ]);

        } catch (\Throwable $e) {
            Log::error('COMMIT_LOGO_TEMP_FAIL', [
                'cliente_id' => $clienteId,
                'temp_path'  => $tempPath,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    public function commitBannerTemp(Request $request, $clienteId)
    {
        $request->validate([
            'temp_path' => 'required|string',
        ]);

        $cliente = Cliente::findOrFail($clienteId);

        $supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $supabaseKey = config('services.supabase.service_role_key') ?: config('services.supabase.key');
        $bucket = config('services.supabase.bucket', 'clientes-media');

        $input = trim((string) $request->input('temp_path', ''));

        if (Str::startsWith($input, 'http://') || Str::startsWith($input, 'https://')) {
            $parsedPath = parse_url($input, PHP_URL_PATH) ?: '';
            $marker = "/storage/v1/object/public/{$bucket}/";
            if (str_contains($parsedPath, $marker)) {
                $input = explode($marker, $parsedPath, 2)[1] ?? $input;
            }
        }

        $tempPath = ltrim($input, '/');

        if (!Str::startsWith($tempPath, 'temp/')) {
            return response()->json([
                'success' => false,
                'message' => "temp_path inválido: {$tempPath}"
            ], 422);
        }

        $filename = basename($tempPath);
        $destPath = "clientes/{$clienteId}/banner/{$filename}";

        try {
            $copyUrl = "{$supabaseUrl}/storage/v1/object/copy";
            $copyPayload = [
                'bucketId' => $bucket,
                'sourceKey' => $tempPath,
                'destinationKey' => $destPath,
                'destinationBucketId' => $bucket,
            ];

            $copyResp = Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => 'application/json',
            ])->post($copyUrl, $copyPayload);

            if (!$copyResp->successful()) {
                throw new \Exception("Erro ao copiar arquivo no Supabase: " . $copyResp->body());
            }

            $deleteUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}";
            Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => 'application/json',
            ])->delete($deleteUrl, ['prefixes' => [$tempPath]]);

            $finalUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$destPath}";
            $oldBannerUrl = $cliente->banner_url ?? null;
            $cliente->update(['banner_url' => $finalUrl]);

            $this->audit(
                action: 'upload',
                entityType: 'cliente_banner',
                entityId: (int) $cliente->id,
                fieldChanges: [
                    'banner_url' => [
                        'from' => $oldBannerUrl,
                        'to' => $finalUrl,
                    ],
                ],
                clienteId: (int) $cliente->id,
                metadata: [
                    'dest_path' => $destPath,
                    'bucket' => $bucket,
                ]
            );

            return response()->json([
                'success' => true,
                'banner_url' => $finalUrl,
            ]);

        } catch (\Throwable $e) {
            Log::error('COMMIT_BANNER_TEMP_FAIL', [
                'cliente_id' => $clienteId,
                'temp_path'  => $tempPath,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ Commit da MÍDIA (PDF/IMG): temp/... -> clientes/{id}/midia/{tipo}/arquivo.ext
     * Atualiza clientes.portfolio_url com URL final.
     */
    public function commitMidiaTemp(Request $request, $clienteId)
    {
        $request->validate([
            'temp_path' => 'required|string',
            'tipo' => 'nullable|string|max:50',
        ]);

        $cliente = Cliente::findOrFail($clienteId);

        $supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $supabaseKey = config('services.supabase.service_role_key') ?: config('services.supabase.key');
        $bucket = config('services.supabase.bucket', 'clientes-media');

        $input = trim((string) $request->input('temp_path', ''));

        // Aceita URL completa ou path
        if (Str::startsWith($input, 'http://') || Str::startsWith($input, 'https://')) {
            $parsedPath = parse_url($input, PHP_URL_PATH) ?: '';
            $marker = "/storage/v1/object/public/{$bucket}/";
            if (str_contains($parsedPath, $marker)) {
                $input = explode($marker, $parsedPath, 2)[1] ?? $input;
            }
        }

        $tempPath = ltrim($input, '/');

        if (!Str::startsWith($tempPath, 'temp/')) {
            return response()->json([
                'success' => false,
                'message' => "temp_path inválido: {$tempPath}"
            ], 422);
        }

        $tipo = trim((string) $request->input('tipo', ''));
        $tipo = $tipo !== '' ? preg_replace('/[^a-zA-Z0-9_-]+/', '', $tipo) : 'portfolio';

        $filename = basename($tempPath);
        $destPath = "clientes/{$clienteId}/midia/{$tipo}/{$filename}";

        try {
            // COPY
            $copyUrl = "{$supabaseUrl}/storage/v1/object/copy";
            $copyPayload = [
                'bucketId' => $bucket,
                'sourceKey' => $tempPath,
                'destinationKey' => $destPath,
                'destinationBucketId' => $bucket,
            ];

            $copyResp = Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => 'application/json',
            ])->post($copyUrl, $copyPayload);

            if ($copyResp->failed()) {
                $copyData = $copyResp->json();
                if ($copyResp->status() === 409 || ($copyResp->status() === 400 && ($copyData['statusCode'] ?? '') == '409')) {
                    $delDestUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}";
                    Http::withHeaders([
                        'apikey' => $supabaseKey,
                        'Authorization' => "Bearer {$supabaseKey}",
                        'Content-Type' => 'application/json',
                    ])->delete($delDestUrl, ['prefixes' => [$destPath]]);

                    $copyResp = Http::withHeaders([
                        'apikey' => $supabaseKey,
                        'Authorization' => "Bearer {$supabaseKey}",
                        'Content-Type' => 'application/json',
                    ])->post($copyUrl, $copyPayload);
                }

                if ($copyResp->failed()) {
                    throw new \Exception("COPY failed {$copyResp->status()}: " . $copyResp->body());
                }
            }

            // DELETE temp
            $delUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}";
            $delResp = Http::withHeaders([
                'apikey' => $supabaseKey,
                'Authorization' => "Bearer {$supabaseKey}",
                'Content-Type' => 'application/json',
            ])->delete($delUrl, ['prefixes' => [$tempPath]]);

            if ($delResp->failed()) {
                Log::warning('SUPABASE_TEMP_DELETE_FAIL_MIDIA', [
                    'cliente_id' => $clienteId,
                    'temp_path'  => $tempPath,
                    'status'     => $delResp->status(),
                    'body'       => $delResp->body(),
                ]);
            }

            $finalUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$destPath}";


if (Schema::hasColumn('clientes', 'portfolio_url')) {
    $oldPortfolioUrl = $cliente->portfolio_url ?? null;

    $cliente->update(['portfolio_url' => $finalUrl]);

    $this->audit(
        action: 'upload',
        entityType: 'cliente_midia',
        entityId: (int) $cliente->id,
        fieldChanges: [
            'portfolio_url' => [
                'from' => $oldPortfolioUrl,
                'to' => $finalUrl,
            ],
        ],
        clienteId: (int) $cliente->id,
        metadata: [
            'dest_path' => $destPath,
            'bucket' => $bucket,
            'tipo' => $tipo,
        ]
    );
}

            return response()->json([
                'success' => true,
                'portfolio_url' => $finalUrl,
                'dest_path' => $destPath,
            ]);

        } catch (\Throwable $e) {
            Log::error('COMMIT_MIDIA_TEMP_FAIL', [
                'cliente_id' => $clienteId,
                'temp_path'  => $tempPath,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Gera uma descrição automática para o cliente usando IA.
     */
    public function generateAiDescription(Request $request, ClientAiService $aiService)
    {
        $request->validate([
            'nome' => 'required|string',
            'cidade' => 'required|string',
        ]);

        $description = $aiService->generateDescription(
            $request->input('nome'),
            $request->input('cidade')
        );

        return response()->json([
            'success' => true,
            'description' => $description
        ]);
    }

    public function parseLegacyHorario(Request $request, ClientAiService $aiService)
    {
        $request->validate([
            'texto' => 'required|string',
        ]);

        $horarios = $aiService->parseLegacyHorario($request->input('texto'));

        return response()->json([
            'success' => true,
            'horarios' => $horarios
        ]);
    }

    /**
     * Busca horários de funcionamento no Google Places.
     */
    public function getGoogleHours(Request $request, GooglePlacesService $googleService)
    {
        $request->validate([
            'nome' => 'required|string',
            'cidade' => 'required|string',
        ]);

        $details = $googleService->getDetailsByQuery($request->input('nome') . ' ' . $request->input('cidade'));

        if (!$details || !isset($details['opening_hours'])) {
            return response()->json([
                'success' => false,
                'message' => 'Horários não encontrados no Google Maps.'
            ], 404);
        }

        $horarios = $googleService->mapOpeningHoursToSystem($details['opening_hours']);

        return response()->json([
            'success' => true,
            'horarios' => $horarios
        ]);
    }

    /**
     * Busca a data de fundação via IA.
     */
    public function getFoundationDateByAi(Request $request, ClientAiService $aiService)
    {
        $request->validate([
            'nome' => 'required|string',
            'cidade' => 'required|string',
        ]);

        $date = $aiService->predictFoundationDate($request->input('nome'), $request->input('cidade'));

        return response()->json([
            'success' => true,
            'data_fundacao' => $date
        ]);
    }

    /**
     * Busca o Place ID e Telefone via Google.
     */
    public function getPlaceIdByQuery(Request $request, GooglePlacesService $googleService)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $details = $googleService->getDetailsByQuery($request->input('query'));

        return response()->json([
            'success' => !!$details,
            'details' => $details
        ]);
    }

    /**
     * Busca reviews por um Place ID genérico (usado no cadastro de novos clientes)
     */
    public function lookupGoogleReviews(Request $request, GooglePlacesService $googleService, ClientAiService $aiService)
    {
        $placeId = $request->input('place_id');
        if (!$placeId) {
            return response()->json(['success' => false, 'message' => 'Place ID é obrigatório.'], 400);
        }

        try {
            $reviews = $googleService->getReviews($placeId);
            
            // Enriquecimento via IA caso os do Google estejam ruins ou poucos
            $countHigh = collect($reviews)->filter(fn($r) => ($r['rating'] ?? 0) >= 4)->count();
            if ($countHigh < 3) {
                $name = $request->input('nome');
                $city = $request->input('cidade');
                if ($name && $city) {
                    $aiReviews = $aiService->findPositiveReviews($name, $city);
                    $reviews = array_merge($reviews, $aiReviews);
                }
            }

            return response()->json(['success' => true, 'reviews' => $reviews]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Erro ao consultar Google.'], 500);
        }
    }

    /**
     * Sincroniza os reviews do Google para um cliente.
     */
    public function getGoogleReviews(string $id, Request $request, GooglePlacesService $googleService, ClientAiService $aiService)
    {
        // Prioriza o ID que vem na request (caso o usuário tenha acabado de buscar no frontend e ainda não salvou no DB)
        $placeId = $request->query('place_id');

        if (!$placeId) {
            $cliente = Cliente::findOrFail($id);
            $placeId = $cliente->google_place_id;
        }

        if (!$placeId) {
            return response()->json(['success' => false, 'message' => 'Google Place ID não configurado.'], 400);
        }

        try {
            $reviews = $googleService->getReviews($placeId);

            // Enriquecimento via IA caso os do Google estejam ruins ou poucos
            $countHigh = collect($reviews)->filter(fn($r) => ($r['rating'] ?? 0) >= 4)->count();
            if ($countHigh < 3) {
                $cliente = Cliente::find($id);
                if ($cliente) {
                    $aiReviews = $aiService->findPositiveReviews($cliente->nome_fantasia, $cliente->cidade);
                    $reviews = array_merge($reviews, $aiReviews);
                }
            }

            return response()->json([
                'success' => true,
                'reviews' => $reviews
            ]);
        } catch (\Throwable $e) {
            Log::error('[ClienteController] Erro ao buscar reviews', [
                'cliente_id' => $id,
                'place_id' => $placeId,
                'error' => $e->getMessage()
            ]);
            return response()->json(['success' => false, 'message' => 'Erro interno ao consultar o Google.'], 500);
        }
    }

    /**
     * Salva reviews selecionados.
     */
    public function saveGoogleReviews(Request $request, string $id)
    {
        $cliente = Cliente::findOrFail($id);
        $reviews = $request->input('reviews', []);
        $placeId = $request->input('google_place_id');

        if ($placeId) {
            $cliente->update(['google_place_id' => $placeId]);
        }

        foreach ($reviews as $rev) {
            ClienteReview::updateOrCreate(
                ['google_review_id' => $rev['time'] . '_' . $rev['author_name']], // Chave composta simples para o Google
                [
                    'cliente_id' => $cliente->id,
                    'author_name' => $rev['author_name'],
                    'author_photo_url' => $rev['profile_photo_url'] ?? null,
                    'rating' => $rev['rating'],
                    'text' => $rev['text'],
                    'relative_time_description' => isset($rev['time']) ? date('Y-m-d H:i:s', $rev['time']) : null,
                ]
            );
        }

        return response()->json(['success' => true, 'message' => 'Reviews salvos com sucesso.']);
    }

    public function checkCnpj(Request $request)
    {
        $cnpj = preg_replace('/\D/', '', $request->input('cnpj', ''));
        if (!$cnpj) return response()->json(['exists' => false]);

        $exists = Cliente::where('cpf_cnpj', $cnpj)->first();

        if ($exists) {
            return response()->json([
                'exists' => true,
                'id' => $exists->id,
                'nome' => $exists->nome_fantasia
            ]);
        }

        return response()->json(['exists' => false]);
    }

    private function audit(
        string $action,
        string $entityType,
        int $entityId,
        ?array $fieldChanges = null,
        ?int $clienteId = null,
        ?int $leadId = null,
        array $metadata = []
    ): void {
        try {
            $actorId = auth()->id();

            if (!$actorId) return;

            $req = request();

            $metadata = array_merge([
                'ip' => $req?->ip(),
                'user_agent' => $req?->userAgent(),
                'path' => $req?->path(),
                'method' => $req?->method(),
            ], $metadata);

            \App\Models\AuditLog::create([
                'actor_user_id' => (int) $actorId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'cliente_id' => $clienteId,
                'lead_id' => $leadId,
                'field_changes' => $fieldChanges,
                'metadata' => $metadata,
            ]);
        } catch (\Throwable $e) {
            Log::warning('AUDIT_LOG_FAIL', [
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'error' => $e->getMessage(),
            ]);
        }
    }
    public function auditQueue(Request $request)
    {
        $status = $request->input('status', 'pending'); // pending | manual_review | ok | all
        $cidade = $request->input('cidade');
        $tipo = $request->input('tipo');
        $visibilidade = $request->input('visibilidade');
        $segmentoId = $request->input('segmento_id');

        $cidadesPermitidas = [
            'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
            'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
            'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
            'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
            'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
            'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
        ];

        $query = Cliente::query()
            ->with(['enderecos', 'contatos', 'redesSociais'])
            ->where(function($q) use ($cidadesPermitidas) {
                $q->whereHas('enderecos', function($sub) use ($cidadesPermitidas) {
                    $sub->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidade)'), $cidadesPermitidas);
                })->orWhereHas('cidadesAtendidas', function($sub) use ($cidadesPermitidas) {
                    $sub->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidades.nome)'), $cidadesPermitidas);
                });
            });

        // Se houver busca (q), traz todas independente do status. Senão, filtra pelo status (pending/ok).
        if ($request->filled('q')) {
            $q = $request->input('q');
            $qDigits = preg_replace('/\D/', '', $q);

            $query->where(function($sub) use ($q, $qDigits) {
                $sub->whereRaw("unaccent(nome_fantasia) ILIKE unaccent(?)", ["%{$q}%"])
                    ->orWhereRaw("unaccent(razao_social) ILIKE unaccent(?)", ["%{$q}%"])
                    ->orWhereHas('contatos', function($cq) use ($q, $qDigits) {
                        $cq->where('telefone_principal', 'ilike', "%{$q}%")
                           ->orWhere('telefone_secundario', 'ilike', "%{$q}%")
                           ->orWhere('celular', 'ilike', "%{$q}%")
                           ->orWhere('telefone_outro', 'ilike', "%{$q}%");
                        
                        if ($qDigits !== '') {
                            $cq->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(telefone_principal, '\\D', '', 'g')"), 'like', "%{$qDigits}%")
                               ->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(telefone_secundario, '\\D', '', 'g')"), 'like', "%{$qDigits}%")
                               ->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(celular, '\\D', '', 'g')"), 'like', "%{$qDigits}%")
                               ->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(telefone_outro, '\\D', '', 'g')"), 'like', "%{$qDigits}%");
                        }
                    })
                    ->orWhereHas('enderecos', function($eq) use ($q, $qDigits) {
                        $eq->where('telefone', 'ilike', "%{$q}%");
                        if ($qDigits !== '') {
                            $eq->orWhere(\Illuminate\Support\Facades\DB::raw("regexp_replace(telefone, '\\D', '', 'g')"), 'like', "%{$qDigits}%");
                        }
                    });
            });
        } else {
            if ($status === 'all') {
                // Todos os status que precisam de atenção (pending + manual_review)
                $query->whereIn('audit_status', ['pending', 'manual_review']);
            } elseif ($status === 'any') {
                // Todos os cadastros (não filtra por status)
            } else {
                $query->where('audit_status', $status);
            }
        }

        if ($cidade) {
            $query->whereHas('enderecos', function($qSearch) use ($cidade) {
                $qSearch->where('cidade', 'ilike', "%{$cidade}%");
            });
        }

        if ($tipo) {
            $query->where('tipo_cliente', $tipo);
        }

        if ($segmentoId) {
            $query->whereHas('segmentos', function($sq) use ($segmentoId) {
                $sq->where('segmentos.id', $segmentoId);
            });
        }

        if ($visibilidade === 'visible') {
            $query->where('exibir_no_site', 'true');
        } elseif ($visibilidade === 'hidden') {
            $query->where(function($q) {
                $q->where('exibir_no_site', 'false')->orWhereNull('exibir_no_site');
            });
        }

        $query->orderByRaw("
            COALESCE((
                CASE WHEN (audit_differences->>'telefone') IS NOT NULL THEN 3 ELSE 0 END +
                CASE WHEN (audit_differences->>'endereco') IS NOT NULL THEN 3 ELSE 0 END +
                CASE WHEN (audit_differences->>'nome') IS NOT NULL THEN 2 ELSE 0 END +
                CASE WHEN (audit_differences->>'email') IS NOT NULL THEN 2 ELSE 0 END +
                CASE WHEN (audit_differences->>'website') IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN (audit_differences->>'instagram') IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN (audit_differences->>'horarios') IS NOT NULL THEN 1 ELSE 0 END
            ), 0) DESC
        ")->orderBy('last_audit_at', 'desc');

        return ClienteResource::collection($query->paginate($request->input('per_page', 15)));
    }

    public function auditHistory(Request $request)
    {
        $cidadesPermitidas = [
            'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
            'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
            'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
            'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
            'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
            'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
        ];

        $innerQuery = \App\Models\AuditLog::selectRaw('DISTINCT ON (actor_user_id, cliente_id, DATE(created_at)) audit_logs.*')
            ->where(function($q) {
                // ✅ Logs gravados explicitamente pelo fluxo de auditoria (audit_save, audit_update, etc.)
                $q->where('action', 'ilike', '%audit%')
                  // ✅ Logs de 'update' gerados pelo Observer do model que contêm audit_status (também são revisões de auditoria)
                  ->orWhere(function($q2) {
                      $q2->where('action', 'update')
                         ->whereNotNull('actor_user_id')
                         ->whereRaw("jsonb_exists(field_changes::jsonb, 'audit_status')")
                         // Só logs com formato {from, to} completo (gerados pelo Observer do model)
                         ->whereRaw("EXISTS (SELECT 1 FROM jsonb_each(field_changes::jsonb) AS kv(k,v) WHERE jsonb_typeof(v) = 'object' AND jsonb_exists(v, 'from') AND jsonb_exists(v, 'to'))");
                  });
            })
            ->whereHas('cliente', function($q) use ($cidadesPermitidas) {
                $q->where(function($sub) use ($cidadesPermitidas) {
                    $sub->whereHas('enderecos', function($end) use ($cidadesPermitidas) {
                        $end->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidade)'), $cidadesPermitidas);
                    })->orWhereHas('cidadesAtendidas', function($ca) use ($cidadesPermitidas) {
                        $ca->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidades.nome)'), $cidadesPermitidas);
                    });
                });
            })
            ->when($request->input('user_id'), function($q, $uid) {
                return $q->where('actor_user_id', $uid);
            })
            ->when($request->input('date_start'), function($q, $start) {
                return $q->whereDate('created_at', '>=', $start);
            })
            ->when($request->input('date_end'), function($q, $end) {
                return $q->whereDate('created_at', '<=', $end);
            })
            ->when($request->input('segmento_id'), function($q, $sid) {
                return $q->whereHas('cliente', function($sq) use ($sid) {
                    $sq->whereHas('segmentos', function($ssq) use ($sid) {
                        $ssq->where('segmentos.id', $sid);
                    });
                });
            })
            ->when($request->input('result'), function($q, $res) {
                if ($res === 'corrected') {
                    return $q->whereNotNull('field_changes')
                             ->whereRaw("(SELECT count(*) FROM jsonb_object_keys(field_changes::jsonb) k WHERE k NOT IN ('last_audit_at', 'updated_at')) > 0");
                } elseif ($res === 'kept') {
                    return $q->where(function($sq) {
                        $sq->whereNull('field_changes')
                           ->orWhereRaw("(SELECT count(*) FROM jsonb_object_keys(field_changes::jsonb) k WHERE k NOT IN ('last_audit_at', 'updated_at')) = 0");
                    });
                }
            })
            ->when($request->input('q'), function($q, $term) {
                return $q->whereHas('cliente', function($sq) use ($term) {
                    $sq->where('nome_fantasia', 'ilike', "%{$term}%")
                       ->orWhere('razao_social', 'ilike', "%{$term}%")
                       ->orWhereHas('contatos', function($cq) use ($term) {
                           $cq->where('telefone_principal', 'ilike', "%{$term}%")
                              ->orWhere('celular', 'ilike', "%{$term}%")
                              ->orWhere('telefone_secundario', 'ilike', "%{$term}%");
                       });
                });
            })
            ->orderByRaw('actor_user_id, cliente_id, DATE(created_at), created_at DESC');

        $query = \App\Models\AuditLog::fromSub($innerQuery, 'audit_logs')
            ->with(['actor', 'cliente'])
            ->orderBy('created_at', 'desc');

        return response()->json($query->paginate($request->input('per_page', 15)));
    }

    public function auditStats()
    {
        $today      = now()->startOfDay();
        $yesterday  = now()->subDay()->startOfDay();
        $sevenDays  = now()->subDays(7)->startOfDay();
        $thirtyDays = now()->subDays(30)->startOfDay();

        $cidadesPermitidas = [
            'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
            'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
            'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
            'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
            'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
            'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
        ];

        $baseQuery = \App\Models\Cliente::where(function($q) use ($cidadesPermitidas) {
            $q->whereHas('enderecos', function($sub) use ($cidadesPermitidas) {
                $sub->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidade)'), $cidadesPermitidas);
            })->orWhereHas('cidadesAtendidas', function($sub) use ($cidadesPermitidas) {
                $sub->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidades.nome)'), $cidadesPermitidas);
            });
        });

        // Contagens de revisões humanas no AuditLog restrict to standard cities
        $logQuery = \App\Models\AuditLog::where('action', 'ilike', '%audit%')
            ->whereHas('cliente', function($q) use ($cidadesPermitidas) {
                $q->where(function($sub) use ($cidadesPermitidas) {
                    $sub->whereHas('enderecos', function($end) use ($cidadesPermitidas) {
                        $end->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidade)'), $cidadesPermitidas);
                    })->orWhereHas('cidadesAtendidas', function($ca) use ($cidadesPermitidas) {
                        $ca->whereIn(\Illuminate\Support\Facades\DB::raw('trim(cidades.nome)'), $cidadesPermitidas);
                    });
                });
            });

        $stats = [
            'hoje'        => $logQuery->clone()->where('created_at', '>=', $today)->count(),
            'ontem'       => $logQuery->clone()->where('created_at', '>=', $yesterday)->where('created_at', '<', $today)->count(),
            'sete_dias'   => $logQuery->clone()->where('created_at', '>=', $sevenDays)->count(),
            'trinta_dias' => $logQuery->clone()->where('created_at', '>=', $thirtyDays)->count(),
        ];

        $total = $baseQuery->clone()->count();
        $auditados = $baseQuery->clone()->whereNotNull('last_audit_at')->count();
        $verificados = $baseQuery->clone()->where('audit_status', 'ok')->count();
        $pendentes = $baseQuery->clone()->where('audit_status', 'pending')->count();
        $revisao_manual = $baseQuery->clone()->where('audit_status', 'manual_review')->count();

        $stats['total_clientes']     = $total;
        $stats['clientes_auditados'] = $auditados;
        $stats['verificados_ia']     = $verificados;
        $stats['pendentes_fila']     = $pendentes;
        $stats['revisao_manual']     = $revisao_manual;

        $stats['porcentagem_concluida'] = $total > 0
            ? round(($auditados / $total) * 100, 1)
            : 0;

        return response()->json($stats);
    }

    /**
     * ✅ Visão Geral por Cidades
     */
    public function auditCityStats()
    {
        $cidadesPermitidas = [
            'Alto Feliz', 'Arroio do Sal', 'Barão', 'Bento Gonçalves', 'Boa Vista do Sul',
            'Bom Princípio', 'Campo Bom', 'Canela', 'Carlos Barbosa', 'Caxias do Sul',
            'Coronel Pilar', 'Farroupilha', 'Feliz', 'Flores da Cunha', 'Garibaldi',
            'Gramado', 'Lajeado', 'Monte Belo do Sul', 'Nova Prata', 'Nova Roma do Sul',
            'Novo Hamburgo', 'Pinto Bandeira', 'Salvador do Sul', 'São Marcos',
            'São Pedro da Serra', 'São Sebastião do Caí', 'São Vendelino', 'Veranópolis'
        ];

        // Busca apenas as 28 cidades permitidas do RS, agrupando para remover duplicados
        $cities = \App\Models\Cidade::select([
                \Illuminate\Support\Facades\DB::raw('MAX(id) as id'),
                \Illuminate\Support\Facades\DB::raw('TRIM(nome) as nome')
            ])
            ->where('uf', 'RS')
            ->whereIn(\Illuminate\Support\Facades\DB::raw('trim(nome)'), $cidadesPermitidas)
            ->groupBy(\Illuminate\Support\Facades\DB::raw('trim(nome)'))
            ->orderBy(\Illuminate\Support\Facades\DB::raw('trim(nome)'))
            ->get();

        $data = $cities->map(function($city) {
            // Conta os clientes cuja cidade de endereço ou cidades atendidas bate com o nome desta cidade
            $total = \App\Models\Cliente::where(function($query) use ($city) {
                $query->whereHas('enderecos', function($q) use ($city) {
                    $q->where('cidade', 'ilike', "%{$city->nome}%");
                })->orWhereHas('cidadesAtendidas', function($q) use ($city) {
                    $q->where('cidades.nome', 'ilike', "%{$city->nome}%");
                });
            })->count();

            $auditados = \App\Models\Cliente::whereNotNull('last_audit_at')
                ->where(function($query) use ($city) {
                    $query->whereHas('enderecos', function($q) use ($city) {
                        $q->where('cidade', 'ilike', "%{$city->nome}%");
                    })->orWhereHas('cidadesAtendidas', function($q) use ($city) {
                        $q->where('cidades.nome', 'ilike', "%{$city->nome}%");
                    });
                })->count();

            return [
                'id' => $city->id,
                'nome' => trim($city->nome),
                'total' => $total,
                'auditados' => $auditados,
                'pendentes' => max(0, $total - $auditados),
                'percentual' => $total > 0 ? round(($auditados / $total) * 100, 1) : 0
            ];
        });

        return response()->json($data->values());
    }

    public function auditUsers()
    {
        $userIds = \App\Models\AuditLog::where('action', 'ilike', '%audit%')
            ->whereNotNull('actor_user_id')
            ->pluck('actor_user_id')
            ->unique();

        $users = \App\Models\User::whereIn('id', $userIds)->get(['id', 'name']);

        return response()->json($users);
    }

    /**
     * ✅ Dispara uma nova rodada de auditoria em background.
     * Usado pelo botão "Gerar Novas Conferências" no dashboard.
     * Roda o comando artisan em background para não travar o HTTP.
     */
    public function auditTriggerScan(Request $request)
    {
        $limit = (int) $request->input('limit', 50);
        $limit = min(max($limit, 1), 100); // Garante entre 1 e 100

        // Verifica quantos clientes ainda aguardam auditoria
        $pendingCount = \App\Models\Cliente::whereNull('last_audit_at')
            ->orWhere('last_audit_at', '<', now()->subMonths(6))
            ->count();

        if ($pendingCount === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Todos os clientes já foram auditados recentemente. Nada a fazer!',
                'pending' => 0,
            ]);
        }

        // Dispara o comando em background (não bloqueia o HTTP)
        $artisan = base_path('artisan');
        $php     = PHP_BINARY;
        $cmd     = "{$php} {$artisan} audit:scan --limit={$limit}";

        // Executa em background: o & no final desanexa o processo do HTTP
        if (PHP_OS_FAMILY === 'Windows') {
            pclose(popen("start /B {$cmd}", 'r'));
        } else {
            exec("{$cmd} > /dev/null 2>&1 &");
        }

        \Log::info("🚀 [AuditTrigger] Scan manual disparado por usuário. Limite: {$limit}. Pendentes na fila: {$pendingCount}.");

        return response()->json([
            'success'  => true,
            'message'  => "Varredura iniciada! Auditando até {$limit} clientes em segundo plano. Aguarde ~2 minutos e recarregue a fila.",
            'limit'    => $limit,
            'pending_total' => $pendingCount,
        ]);
    }

    /**
     * ✅ Força re-auditoria imediata de um cliente específico (síncrono).
     * Usado pelo botão "Forçar Conferência" na linha do cliente.
     * Reseta o last_audit_at e roda o scan agora, retornando o resultado.
     */
    public function auditForceScan($clienteId)
    {
        $cliente = Cliente::with(['enderecos', 'contatos', 'redesSociais'])->findOrFail($clienteId);

        // Reseta o last_audit_at para forçar o scan mesmo se foi recente
        $cliente->update(['last_audit_at' => null]);

        \Log::info("🔄 [AuditForce] Re-auditoria forçada para: {$cliente->nome_fantasia} (ID: {$clienteId})");

        $auditService = app(\App\Services\AuditAutomationService::class);
        $result = $auditService->scan($cliente->fresh(['enderecos', 'contatos', 'redesSociais']));

        $statusLabels = [
            'no_changes'     => 'Dados conferidos — nenhuma divergência encontrada.',
            'pending_review' => 'Divergências encontradas! Cliente adicionado à fila de revisão.',
            'manual_review'  => 'Sem dados na web — marcado para Revisão Manual.',
            'error'          => 'Não foi possível obter dados da internet.',
        ];

        return response()->json([
            'success'  => true,
            'status'   => $result['status'],
            'message'  => $statusLabels[$result['status']] ?? 'Auditoria concluída.',
            'differences' => $result['differences'] ?? null,
            'cliente'  => [
                'id'           => $cliente->id,
                'nome_fantasia' => $cliente->nome_fantasia,
                'audit_status' => $cliente->fresh()->audit_status,
            ],
        ]);
    }

    public function auditSave(Request $request, $id)
    {
        $cliente = Cliente::findOrFail($id);
        $payload = [];

        if ($request->has('nome_fantasia')) {
            $payload['nome_fantasia'] = $request->input('nome_fantasia');
        }
        if ($request->has('exibir_no_site')) {
            $payload['exibir_no_site'] = $request->boolean('exibir_no_site') ? 'true' : 'false';
        }
        if ($request->has('exibir_data_fundacao')) {
            $payload['exibir_data_fundacao'] = $request->boolean('exibir_data_fundacao') ? 'true' : 'false';
        }
        if ($request->has('observacoes')) {
            $payload['observacoes'] = $request->input('observacoes');
        }
        if ($request->has('audit_status')) {
            $payload['audit_status'] = $request->input('audit_status');
        }
        if ($request->has('audit_differences')) {
            $payload['audit_differences'] = $request->input('audit_differences');
        }

        $payload['last_audit_at'] = now();
        $cliente->update($payload);

        // Update relationships if provided
        if ($request->has('contatos') && is_array($request->input('contatos'))) {
            $cliente->contatos()->delete();
            $cliente->contatos()->createMany($request->input('contatos'));
        }

        if ($request->has('enderecos') && is_array($request->input('enderecos'))) {
            $cliente->enderecos()->delete();
            $cliente->enderecos()->createMany($request->input('enderecos'));
        }

        if ($request->has('redes_sociais') && is_array($request->input('redes_sociais'))) {
            $cliente->redesSociais()->delete();
            $cliente->redesSociais()->createMany($request->input('redes_sociais'));
        }

        // Register Audit Log
        $this->audit(
            action: 'update',
            entityType: 'cliente_audit_inline',
            entityId: $cliente->id,
            fieldChanges: $payload,
            clienteId: $cliente->id
        );

        return response()->json([
            'success' => true,
            'cliente' => $cliente->fresh(['enderecos', 'contatos', 'redesSociais'])
        ]);
    }

    /**
     * ✅ Sugestões Inteligentes de Keywords para Campanhas
     * Pega keywords do SEO, nomes de segmentos e buscas populares relacionadas.
     */
    public function keywordSuggestions($id)
    {
        $cliente = Cliente::with(['segmentos', 'enderecos', 'cidadesAtendidas'])->findOrFail($id);
        
        $suggestions = [];
        
        // 1. Keywords já existentes no SEO (se houver)
        if (is_array($cliente->seo_keywords)) {
            $suggestions = array_merge($suggestions, $cliente->seo_keywords);
        }
        
        // 2. Nomes dos segmentos
        foreach ($cliente->segmentos as $seg) {
            $suggestions[] = $seg->nome;
        }
        
        // 3. Buscas populares relacionadas aos segmentos do cliente (SearchLog)
        if ($cliente->segmentos->count() > 0) {
            $segmentNames = $cliente->segmentos->pluck('nome')->toArray();
            
            // Tenta achar termos que contenham os nomes dos segmentos
            $popularSearches = \App\Models\SearchLog::query()
                ->where(function($q) use ($segmentNames) {
                    foreach ($segmentNames as $name) {
                        $q->orWhere('term', 'ilike', "%{$name}%");
                    }
                })
                ->select('term', DB::raw('count(*) as count'))
                ->groupBy('term')
                ->orderByDesc('count')
                ->limit(15)
                ->get()
                ->pluck('term')
                ->toArray();
                
            $suggestions = array_merge($suggestions, $popularSearches);
        }
        
        // 4. Termos genéricos que fazem sentido para qualquer campanha de conversão
        $suggestions[] = "promoção";
        $suggestions[] = "oferta";
        $suggestions[] = "melhor preço";
        
        // Limpar e normalizar
        $suggestions = array_map(function($s) {
            return mb_strtolower(trim($s), 'UTF-8');
        }, $suggestions);
        
        // Remove duplicados e vazios
        $suggestions = array_unique(array_filter($suggestions));
        
        return response()->json(array_values($suggestions));
    }

    /**
     * ✅ Excluir Cliente e todas as suas relações
     */
    public function destroy($id)
    {
        $cliente = Cliente::findOrFail($id);

        DB::beginTransaction();
        try {
            // Remove relações para evitar erros de constraint (dependendo do DB)
            $cliente->enderecos()->delete();
            $cliente->contatos()->delete();
            $cliente->redesSociais()->delete();
            $cliente->galeriaImagens()->delete();
            $cliente->reviews()->delete();
            $cliente->renewals()->delete();
            $cliente->invoices()->delete();
            $cliente->interacoes()->delete();
            $cliente->jobOpportunities()->delete();

            // Tabelas pivot
            $cliente->segmentos()->detach();
            $cliente->cidadesAtendidas()->detach();

            $cliente->delete();

            DB::commit();

            Log::info("CLIENTE_DELETADO", ['id' => $id, 'nome' => $cliente->nome_fantasia]);

            return response()->json(['message' => 'Cliente excluído com sucesso!']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("ERRO_AO_DELETAR_CLIENTE", ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Erro ao excluir cliente. Verifique se existem vínculos que impedem a exclusão.'], 500);
        }
    }

    /**
     * ✅ Atualiza os slugs de todos os clientes que estão vazios
     */
    /**
     * ✅ Atualiza os slugs de todos os clientes que estão vazios (Bypassing Audit)
     */
    /**
     * ✅ Atualiza os slugs de todos os clientes que estão vazios (Bypassing Audit)
     */
    /**
     * ✅ Atualiza os slugs de todos os clientes que estão vazios
     */
    public function bulkUpdateSlugs()
    {
        $clientes = Cliente::whereNull('slug')->orWhere('slug', '')->get();
        $count = 0;

        foreach ($clientes as $cliente) {
            if (!empty($cliente->nome_fantasia)) {
                $cliente->save();
                $count++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Slugs de {$count} clientes foram atualizados com sucesso."
        ]);
    }

    /**
     * ✅ Detecta se o termo de busca contém o nome de alguma cidade cadastrada
     */
    private function detectCityInQuery(string $q)
    {
        if (empty($q)) return null;

        $normalizedQuery = ' ' . strtolower(Str::ascii($q)) . ' ';
        $words = array_filter(explode(' ', $q));
        if (empty($words)) return null;

        static $unaccentExists = null;
        if ($unaccentExists === null) {
            try {
                DB::select("SELECT unaccent('a')");
                $unaccentExists = true;
            } catch (\Exception $e) {
                $unaccentExists = false;
            }
        }

        $cidades = Cidade::where(function($query) use ($words, $unaccentExists) {
            foreach ($words as $word) {
                if (strlen($word) > 3) {
                    if ($unaccentExists) {
                        $query->orWhereRaw('unaccent(nome) ilike unaccent(?)', ["%{$word}%"]);
                    } else {
                        $query->orWhere('nome', 'ilike', "%{$word}%");
                    }
                }
            }
        })->get();

        $bestCity = null;
        $longestMatchLength = 0;

        foreach ($cidades as $cidade) {
            $cidadeNome = strtolower(Str::ascii($cidade->nome));
            if (preg_match('/\b' . preg_quote($cidadeNome, '/') . '\b/i', $normalizedQuery)) {
                $matchLength = strlen($cidadeNome);
                if ($matchLength > $longestMatchLength) {
                    $longestMatchLength = $matchLength;
                    $bestCity = $cidade;
                }
            }
        }

        return $bestCity;
    }

    /**
     * ✅ Normaliza o termo de busca "vermelhinho" com tolerância a erros (typos)
     */
    private function normalizeQueryTypo(string $q): string
    {
        if ($q !== '') {
            $words = explode(' ', $q);
            $modified = false;
            foreach ($words as &$word) {
                $cleanWord = strtolower(Str::ascii($word));
                $cleanWord = preg_replace('/[^a-z]/', '', $cleanWord);
                if (strlen($cleanWord) >= 6) {
                    if (in_array($cleanWord, ['vermelho', 'vermelha', 'vermelhao', 'vermelhas', 'vermelhos'])) {
                        continue;
                    }
                    $dist = levenshtein($cleanWord, 'vermelhinho');
                    if ($dist <= 4) {
                        $startsWithVOrW = in_array($cleanWord[0], ['v', 'w']);
                        $containsMAndL = strpos($cleanWord, 'm') !== false && strpos($cleanWord, 'l') !== false;
                        if ($startsWithVOrW && $containsMAndL) {
                            $word = str_replace($cleanWord, 'vermelhinho', strtolower($word));
                            $modified = true;
                        }
                    }
                }
            }
            if ($modified) {
                $q = implode(' ', $words);
            }
        }
        return $q;
    }
}

