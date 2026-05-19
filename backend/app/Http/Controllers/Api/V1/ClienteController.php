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
                $sub->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente'])
                    ->orWhere('tipo_cliente', 'gratuito');
            })
            ->where('exibir_no_site', 'true')
            ->get();
    }

    public function indexPublic(Request $request)
    {
        $q = trim((string) ($request->input('q') ?? ''));
        $perPage = (int) ($request->input('per_page') ?? 15);
        $cityId = $request->input('city_id');
        $cityName = $request->input('city_name');
        
        $query = Cliente::query()
            ->where('exibir_no_site', 'true')
            ->where(function($sub) {
                $sub->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente', 'vencida', 'vencido'])
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
            
            // 1. Verifica se existe uma correção aprendida pelo sistema (Learning Logic)
            $learned = \App\Models\SearchCorrection::where('typo', mb_strtolower($normalizedQ, 'UTF-8'))
                ->orderByDesc('hit_count')
                ->first();
            
            $effectiveQ = $learned ? $learned->correction : $normalizedQ;

            $query->where(function ($sub) use ($q, $normalizedQ, $effectiveQ, $canUseSimilarity) {
                // Match Exato ou Parcial (Alta Prioridade)
                $sub->whereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$q}%"])
                    ->orWhereRaw('unaccent(nome_alternativo) ilike unaccent(?)', ["%{$q}%"]);

                if ($effectiveQ !== $normalizedQ) {
                    $sub->orWhereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$effectiveQ}%"]);
                }

                // 2. Busca por Similaridade (Tolerância a Typos via pg_trgm)
                if ($canUseSimilarity) {
                    // Threshold seguro (0.3) para evitar falsos positivos como 'Deseju Pasteis' em 'desentupidora'
                    // Utilizamos word_similarity para buscar o termo "q" DENTRO de frases maiores
                    $sub->orWhereRaw("word_similarity(?, nome_fantasia) > 0.3", [$normalizedQ])
                        ->orWhereRaw("word_similarity(?, nome_alternativo) > 0.3", [$normalizedQ]);
                } else {
                    // Fallback agressivo por palavras
                    $words = explode(' ', $normalizedQ);
                    foreach ($words as $word) {
                        if (strlen($word) > 2) {
                            $sub->orWhereRaw('unaccent(nome_fantasia) ilike unaccent(?)', ["%{$word}%"]);
                        }
                    }
                }

                // 3. Busca em Segmentos e Endereços
                $sub->orWhereHas('segmentos', function ($sq) use ($q, $effectiveQ, $canUseSimilarity, $normalizedQ) {
                        $sq->whereRaw('unaccent(segmentos.nome) ilike unaccent(?)', ["%{$q}%"])
                           ->orWhereRaw('unaccent(segmentos.nome) ilike unaccent(?)', ["%{$effectiveQ}%"]);
                           
                        if ($canUseSimilarity) {
                            $sq->orWhereRaw("word_similarity(?, segmentos.nome) > 0.3", [$normalizedQ]);
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

        $query->orderByRaw("
            CASE 
                -- 1. Pagante Ativo na Cidade Buscada
                WHEN tipo_cliente = 'pagante' AND status_assinatura IN ('ativa', 'ativo') AND EXISTS (
                    SELECT 1 FROM enderecos 
                    WHERE enderecos.cliente_id = clientes.id 
                    AND (
                        enderecos.cidade ilike (SELECT nome FROM cidades WHERE id = ? LIMIT 1)
                        OR EXISTS (SELECT 1 FROM cliente_cidade cc WHERE cc.cliente_id = clientes.id AND cc.cidade_id = ?)
                    )
                ) THEN 0

                -- 2. Pagante Ativo Geral
                WHEN tipo_cliente = 'pagante' AND status_assinatura IN ('ativa', 'ativo') THEN 1

                -- 3. Gratuito
                ELSE 2
            END ASC
        ", [$orderCityId, $orderCityId]);

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
        if (strlen($q) < 2) return response()->json([]);

        // Busca Clientes (Lógica Inteligente: Aprendizado + Fuzzy)
        $normalizedQ = mb_strtolower(trim(preg_replace('/^(o|a|os|as|de|do|da)\s+/i', '', $q)), 'UTF-8');
        $cityId = $request->input('city_id');
        
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

        $clientes = Cliente::query()
            ->select(['id', 'slug', 'nome_fantasia', 'logo_url', 'tipo_cliente', 'status_assinatura'])
            ->where(function($sub) use ($q, $normalizedQ, $effectiveQ, $canUseSim) {
                // Match direto ou corrigido
                $sub->where('nome_fantasia', 'ilike', "%{$q}%")
                    ->orWhere('nome_fantasia', 'ilike', "%{$normalizedQ}%");
                
                if ($effectiveQ !== $normalizedQ) {
                    $sub->orWhere('nome_fantasia', 'ilike', "%{$effectiveQ}%");
                }
                
                // Similarity (pg_trgm) - Threshold baixo 0.1
                if ($canUseSim) {
                    $sub->orWhereRaw("similarity(nome_fantasia, ?) > 0.1", [$normalizedQ]);
                } else {
                    $sub->orWhere('nome_fantasia', 'ilike', substr($normalizedQ, 0, 3) . "%");
                }
            })
            ->where('exibir_no_site', 'true')
            ->where(fn($sub) => $sub->whereIn('status_assinatura', ['ativa', 'ativo', 'pendente', 'vencida', 'vencido'])->orWhere('tipo_cliente', 'gratuito'))
            ->with(['segmentos', 'enderecos', 'cidadesAtendidas'])
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
                    WHEN tipo_cliente = 'pagante' AND status_assinatura IN ('ativa', 'ativo') THEN 1
                    ELSE 2
                END ASC
            ", [$q])
            ->when($canUseSim, function($os) use ($normalizedQ) {
                $os->orderByRaw("similarity(nome_fantasia, ?) DESC", [$normalizedQ]);
            })
            ->limit(5)
            ->get();

        // Busca Segmentos (Categorias)
        $segmentos = Segmento::query()
            ->where('nome', 'ilike', "%{$q}%")
            ->limit(3)
            ->get();

        return response()->json([
            'results' => $clientes->map(function($c) use ($cityId) {
                $isPagante = ($c->tipo_cliente === 'pagante' && in_array($c->status_assinatura, ['ativa', 'ativo']));
                
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
                    'seo_url' => $seoUrl ?: ("/cliente/" . ($c->slug ?: $c->id))
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

        $query = Cliente::query();

        // ✅ Lite = listagem otimizada (não traz galeria inteira)
        if ($lite) {
            $query->select([
                'id',
                'slug',
                'nome_fantasia',
                'cpf_cnpj',
                'logo_url',
                'tipo_cliente',
                'status_assinatura',
                'possui_publicidade',
                'exibir_no_site',
                'audit_differences',
                'seo_keywords',
                'observacoes',
                'portfolio_url',
                'video',
                'created_at',
                'updated_at',
            ]);

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
            $allowed = ['ativa', 'pendente', 'atrasada', 'suspensa', 'cancelada'];
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

                // cpf/cnpj: tenta por dígitos e por texto também (caso venha mascarado)
                if ($qDigits !== '') {
                    $sub->orWhere('cpf_cnpj', 'like', "%{$qDigits}%");
                } else {
                    $sub->orWhere('cpf_cnpj', 'ilike', "%{$q}%");
                }

                // contatos
                $sub->orWhereHas('contatos', function ($cq) use ($q) {
                    $cq->where('email_principal', 'ilike', "%{$q}%")
                       ->orWhere('telefone_principal', 'ilike', "%{$q}%")
                       ->orWhere('nome_contato', 'ilike', "%{$q}%");
                });

                // endereços
                $sub->orWhereHas('enderecos', function ($eq) use ($q, $unaccentExists) {
                    if ($unaccentExists) {
                        $eq->whereRaw("unaccent(cidade) ilike unaccent(?)", ["%{$q}%"])
                           ->orWhereRaw("unaccent(estado) ilike unaccent(?)", ["%{$q}%"])
                           ->orWhereRaw("unaccent(bairro) ilike unaccent(?)", ["%{$q}%"])
                           ->orWhereRaw("unaccent(rua) ilike unaccent(?)", ["%{$q}%"]);
                    } else {
                        $eq->where('cidade', 'ilike', "%{$q}%")
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
        $query = Cliente::with(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'cidadesAtendidas', 'galeriaImagens', 'reviews', 'jobOpportunities'])
            ->where('exibir_no_site', 'true');
        
        if (is_numeric($id)) {
            $cliente = $query->find($id);
        } else {
            $cliente = $query->where('slug', $id)->first();
        }

        if (!$cliente) {
            return response()->json(['message' => 'Cliente não encontrado'], 404);
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
            ->where('id', '!=', $id)
            ->where('exibir_no_site', 'true')
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

                'cpf_cnpj' => [
                    'nullable',
                    'string',
                    'max:20',
                    Rule::unique('clientes', 'cpf_cnpj'),
                    function ($attribute, $value, $fail) {
                        if (empty($value)) return;
                        $exists = Cliente::query()
                            ->select(['id', 'nome_fantasia', 'cpf_cnpj'])
                            ->where('cpf_cnpj', $value)
                            ->first();

                        if ($exists) {
                            $fail("CNPJ já cadastrado (cliente #{$exists->id}: {$exists->nome_fantasia}).");
                        }
                    }
                ],

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
                'enderecos.*.rua'          => 'nullable|string',
                'enderecos.*.numero'       => 'nullable|string',
                'enderecos.*.complemento'  => 'nullable|string',
                'enderecos.*.link_maps'    => 'nullable|string|max:500',
                'enderecos.*.link_waze'    => 'nullable|string|max:500',
                'enderecos.*.exibir_apenas_cidade' => 'nullable|boolean',
                'endereco.exibir_apenas_cidade'    => 'nullable|boolean',

                'contatos'                      => 'nullable|array',
                'contatos.*.telefone_principal'  => 'nullable|string|max:50',
                'contatos.*.telefone_secundario' => 'nullable|string|max:50',
                'contatos.*.celular'             => 'nullable|string|max:50',
                'contatos.*.telefone_outro'      => 'nullable|string|max:50',
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

                'redes_sociais'        => 'nullable|array',
                'redes_sociais.*.tipo' => 'nullable|string|max:50',
                'redes_sociais.*.url'  => 'nullable|string|max:500',

                'logo_url' => 'nullable|string|max:255',
                'banner_url' => 'nullable|string|max:255',
                'horario_atendimento' => 'nullable',

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
                $tipoCliente === 'pagante' ? 'pendente' : 'cancelada'
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
                'exibir_no_site'        => $request->boolean('exibir_no_site', true),
                'exibir_data_fundacao'  => $request->boolean('exibir_data_fundacao', true),
                'possui_publicidade'    => $request->boolean('possui_publicidade'),
            ];

            if (Schema::hasColumn('clientes', 'horario_atendimento')) {
                $clienteData['horario_atendimento'] = $validated['horario_atendimento'] ?? null;
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
                    $segmentosData[$segId] = ['is_primary' => $index === 0];
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
                    $cliente->enderecos()->create($end);
                }
            }

            if (!empty($validated['contatos']) && is_array($validated['contatos'])) {
                foreach ($validated['contatos'] as $contato) {
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

            $request->merge(['redes_sociais' => $redesNormalized]);

            $validated = $request->validate([
                'nome_fantasia' => 'required|string|max:255',

                'cpf_cnpj' => [
                    'nullable',
                    'string',
                    'max:20',
                    Rule::unique('clientes', 'cpf_cnpj')->ignore($cliente->id),
                    function ($attribute, $value, $fail) use ($cliente) {
                        if (empty($value)) return;
                        $exists = Cliente::query()
                            ->select(['id', 'nome_fantasia', 'cpf_cnpj'])
                            ->where('cpf_cnpj', $value)
                            ->where('id', '!=', $cliente->id)
                            ->first();

                        if ($exists) {
                            $fail("CNPJ já cadastrado (cliente #{$exists->id}: {$exists->nome_fantasia}).");
                        }
                    }
                ],

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
                'contatos.*.telefone_secundario' => 'nullable|string|max:50',
                'contatos.*.celular'             => 'nullable|string|max:50',
                'contatos.*.telefone_outro'      => 'nullable|string|max:50',
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

                'redes_sociais'        => 'nullable|array',
                'redes_sociais.*.tipo' => 'nullable|string|max:50',
                'redes_sociais.*.url'  => 'nullable|string|max:500',

                'logo_url' => 'nullable|string|max:255',
                'banner_url' => 'nullable|string|max:255',
                'horario_atendimento' => 'nullable',

                'generate_seo_keywords' => 'nullable|boolean',
                'seo_keywords_text'     => 'nullable|string',
                'data_fundacao'         => 'nullable|date',
                'google_place_id'       => 'nullable|string|max:255',
                'reviews'               => 'nullable|array',
                'beneficios'            => 'nullable|array',
                'beneficios.*'          => 'string|max:100',
                'audit_status'          => 'nullable|string|in:ok,pending,scanning',
                'last_audit_at'         => 'nullable|date',
                'audit_differences'     => 'nullable',
                'audit_action'          => 'nullable|string',
                'contact_preference'    => 'nullable|string|max:50',
                'best_contact_shift'    => 'nullable|string|max:50',
            ]);

            $generate = $request->boolean('generate_seo_keywords', true);

            DB::beginTransaction();

            $tipoCliente = $validated['tipo_cliente'] ?? ($cliente->tipo_cliente ?? 'gratuito');

            // se não vier status_assinatura, mantém atual; se não existir, define default
            $statusAssinatura = $validated['status_assinatura']
                ?? ($cliente->status_assinatura ?? ($tipoCliente === 'pagante' ? 'pendente' : 'cancelada'));

            $seoSource = $generate ? 'generated' : 'manual';

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
                'exibir_no_site'        => $request->boolean('exibir_no_site', $cliente->exibir_no_site ?? true),
                'exibir_data_fundacao'  => $request->boolean('exibir_data_fundacao', $cliente->exibir_data_fundacao ?? true),
                'possui_publicidade'    => $request->boolean('possui_publicidade', $cliente->possui_publicidade ?? false),
                'audit_status'          => $validated['audit_status'] ?? $cliente->audit_status,
                'audit_differences'     => $validated['audit_differences'] ?? $cliente->audit_differences,
                'contact_preference'    => $validated['contact_preference'] ?? $cliente->contact_preference,
                'best_contact_shift'    => $validated['best_contact_shift'] ?? $cliente->best_contact_shift,
            ];

            if (isset($validated['last_audit_at'])) {
                $clienteData['last_audit_at'] = $validated['last_audit_at'];
            }

            if (Schema::hasColumn('clientes', 'horario_atendimento')) {
                $clienteData['horario_atendimento'] = $validated['horario_atendimento'] ?? null;
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

            if (Schema::hasColumn('clientes', 'tipo_cliente')) {
                $clienteData['tipo_cliente'] = $tipoCliente;
            }

            if (Schema::hasColumn('clientes', 'status_assinatura')) {
                $clienteData['status_assinatura'] = $statusAssinatura;
            }

            if (Schema::hasColumn('clientes', 'data_fundacao')) {
                $clienteData['data_fundacao'] = $validated['data_fundacao'] ?? null;
            }

            if ($request->has('horario_atendimento')) {
                $clienteData['horario_atendimento'] = $request->input('horario_atendimento');
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
                        $segmentosData[$segId] = ['is_primary' => $index === 0];
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
                            'cep'                  => $end['cep'] ?? null,
                            'estado'               => $end['estado'] ?? null,
                            'cidade'               => $end['cidade'] ?? null,
                            'bairro'               => $end['bairro'] ?? null,
                            'rua'                  => $end['rua'] ?? null,
                            'numero'               => $end['numero'] ?? null,
                            'complemento'          => $end['complemento'] ?? null,
                            'link_maps'            => $end['link_maps'] ?? null,
                            'link_waze'            => $end['link_waze'] ?? null,
                            'exibir_apenas_cidade' => $end['exibir_apenas_cidade'] ?? false,
                            'is_cobranca'          => $end['is_cobranca'] ?? false,
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
                    $c = $cliente->contatos()->orderBy('id', 'asc')->first();
                    if ($c) {
                        $c->update($c0);
                    } else {
                        $cliente->contatos()->create($c0);
                    }
                }
            }

            // redes sociais: recria
            if (array_key_exists('redes_sociais', $validated)) {
                $cliente->redesSociais()->delete();

                if (!empty($validated['redes_sociais']) && is_array($validated['redes_sociais'])) {
                    foreach ($validated['redes_sociais'] as $rede) {
                        $cliente->redesSociais()->create([
                            'tipo' => $rede['tipo'],
                            'url'  => $rede['url'] ?? null,
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
        $status = $request->input('status', 'pending');
        $cidade = $request->input('cidade');
        $tipo = $request->input('tipo');
        $visibilidade = $request->input('visibilidade');
        $segmentoId = $request->input('segmento_id');

        $query = Cliente::query()
            ->with(['enderecos', 'contatos']);

        // Se houver busca (q), traz todas independente do status. Senão, filtra pelo status (pending/ok).
        if ($request->filled('q')) {
            $q = $request->input('q');
            $query->where(function($sub) use ($q) {
                $sub->where('nome_fantasia', 'ilike', "%{$q}%")
                    ->orWhere('razao_social', 'ilike', "%{$q}%")
                    ->orWhereHas('contatos', function($cq) use ($q) {
                        $cq->where('telefone_principal', 'ilike', "%{$q}%")
                           ->orWhere('celular', 'ilike', "%{$q}%")
                           ->orWhere('telefone_secundario', 'ilike', "%{$q}%");
                    });
            });
        } else {
            $query->where('audit_status', $status);
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

        $query->orderByRaw("CASE WHEN tipo_cliente = 'pagante' THEN 0 ELSE 1 END")
              ->orderBy('last_audit_at', 'desc');

        return ClienteResource::collection($query->paginate($request->input('per_page', 15)));
    }

    public function auditHistory(Request $request)
    {
        $query = \App\Models\AuditLog::where('action', 'ilike', '%audit%')
            ->with(['actor', 'cliente'])
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
                    // Tem alguma chave que não seja last_audit_at ou updated_at
                    return $q->whereNotNull('field_changes')
                             ->whereRaw("(SELECT count(*) FROM jsonb_object_keys(field_changes::jsonb) k WHERE k NOT IN ('last_audit_at', 'updated_at')) > 0");
                } elseif ($res === 'kept') {
                    // Não tem chaves relevantes
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
            ->orderBy('created_at', 'desc');

        return response()->json($query->paginate($request->input('per_page', 15)));
    }

    public function auditStats()
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();
        $sevenDays = now()->subDays(7)->startOfDay();
        $thirtyDays = now()->subDays(30)->startOfDay();

        $stats = [
            'hoje' => \App\Models\AuditLog::where('action', 'ilike', '%audit%')
                ->where('created_at', '>=', $today)
                ->count(),
            'ontem' => \App\Models\AuditLog::where('action', 'ilike', '%audit%')
                ->where('created_at', '>=', $yesterday)
                ->where('created_at', '<', $today)
                ->count(),
            'sete_dias' => \App\Models\AuditLog::where('action', 'ilike', '%audit%')
                ->where('created_at', '>=', $sevenDays)
                ->count(),
            'trinta_dias' => \App\Models\AuditLog::where('action', 'ilike', '%audit%')
                ->where('created_at', '>=', $thirtyDays)
                ->count(),
                
            // Indicadores de Cobertura Total
            'total_clientes' => \App\Models\Cliente::count(),
            'clientes_auditados' => \App\Models\Cliente::whereNotNull('last_audit_at')->count(),
        ];

        $stats['porcentagem_concluida'] = $stats['total_clientes'] > 0 
            ? round(($stats['clientes_auditados'] / $stats['total_clientes']) * 100, 1) 
            : 0;

        return response()->json($stats);
    }

    /**
     * ✅ Visão Geral por Cidades
     */
    public function auditCityStats()
    {
        // Pega todas as cidades que possuem clientes vinculados (via enderecos ou cliente_cidade)
        $cities = \App\Models\Cidade::select('id', 'nome')->get();

        $data = $cities->map(function($city) {
            $total = \App\Models\Cliente::whereHas('enderecos', function($q) use ($city) {
                $q->where('cidade', 'ilike', "%{$city->nome}%");
            })->orWhereHas('cidadesAtendidas', function($q) use ($city) {
                $q->where('cidades.id', $city->id);
            })->count();

            if ($total === 0) return null;

            $auditados = \App\Models\Cliente::whereNotNull('last_audit_at')
                ->where(function($sub) use ($city) {
                    $sub->whereHas('enderecos', function($q) use ($city) {
                        $q->where('cidade', 'ilike', "%{$city->nome}%");
                    })->orWhereHas('cidadesAtendidas', function($q) use ($city) {
                        $q->where('cidades.id', $city->id);
                    });
                })->count();

            return [
                'id' => $city->id,
                'nome' => $city->nome,
                'total' => $total,
                'auditados' => $auditados,
                'pendentes' => $total - $auditados,
                'percentual' => round(($auditados / $total) * 100, 1)
            ];
        })->filter()->values();

        return response()->json($data);
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
}
