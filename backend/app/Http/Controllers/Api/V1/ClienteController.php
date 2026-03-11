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
    public function indexPublic(Request $request)
    {
        $q = trim((string) ($request->input('q') ?? ''));
        $perPage = (int) ($request->input('per_page') ?? 15);
        $cityId = $request->input('city_id');
        $cityName = $request->input('city_name');
        
        $query = Cliente::query()
            ->where(function($sub) {
                $sub->where('status_assinatura', 'ativa')
                    ->orWhere('tipo_cliente', 'gratuito');
            });

        // ✅ Busca por termo com Lógica Fuzzy (Resiliente a Erros)
        if ($q !== '') {
            $normalizedQ = trim(preg_replace('/^(o|a|os|as|de|do|da)\s+/i', '', $q));
            
            $query->where(function ($sub) use ($q, $normalizedQ) {
                // 1. Match Exato ou Parcial (Alta Prioridade)
                $sub->where('nome_fantasia', 'ilike', "%{$q}%")
                    ->orWhere('nome_alternativo', 'ilike', "%{$q}%");

                // 2. Busca por Similaridade (Tolerância a Typos via pg_trgm)
                static $canUseSimilarity = null;
                if ($canUseSimilarity === null) {
                    try {
                        DB::select('SELECT similarity(\'a\', \'b\')');
                        $canUseSimilarity = true;
                    } catch (\Exception $e) { $canUseSimilarity = false; }
                }

                if ($canUseSimilarity) {
                    $sub->orWhereRaw("similarity(nome_fantasia, ?) > 0.15", [$normalizedQ])
                        ->orWhereRaw("similarity(nome_alternativo, ?) > 0.15", [$normalizedQ]);
                } else {
                    // Fallback agressivo por palavras
                    $words = explode(' ', $normalizedQ);
                    foreach ($words as $word) {
                        if (strlen($word) > 2) {
                            $sub->orWhere('nome_fantasia', 'ilike', "%{$word}%");
                        }
                    }
                }

                // 3. Busca em Segmentos e Endereços
                $sub->orWhereHas('segmentos', function ($sq) use ($q) {
                        $sq->where('segmentos.nome', 'ilike', "%{$q}%");
                    })
                    ->orWhereHas('enderecos', function ($eq) use ($q) {
                        $eq->where('bairro', 'ilike', "%{$q}%")
                           ->orWhere('cidade', 'ilike', "%{$q}%")
                           ->orWhere('rua', 'ilike', "%{$q}%");
                    });
            });
        }

        // ✅ Filtro por Cidade (Geolocalização Contextual)
        if ($cityId) {
            $query->where(function($sub) use ($cityId) {
                $sub->whereHas('cidadesAtendidas', function($c) use ($cityId) {
                    $c->where('cidades.id', $cityId);
                })->orWhereHas('enderecos', function($e) use ($cityId) {
                    $city = \App\Models\Cidade::find($cityId);
                    if ($city) {
                        $e->where('cidade', 'ilike', "%{$city->nome}%");
                    }
                });
            });
        } elseif ($cityName) {
            $query->where(function($sub) use ($cityName) {
                $sub->whereHas('cidadesAtendidas', function($c) use ($cityName) {
                    $c->where('cidades.nome', 'ilike', "%{$cityName}%");
                })->orWhereHas('enderecos', function($e) use ($cityName) {
                    $e->where('cidade', 'ilike', "%{$cityName}%");
                });
            });
        }

        $query->with(['enderecos', 'segmentos', 'cidadesAtendidas', 'contatos']);
        $query->withCount(['reviews']);
        
        // ✅ PRIORIDADE: Pagantes locais, depois pagantes que atendem a região, depois gratuitos
        if ($cityId) {
            $query->orderByRaw("
                CASE 
                    WHEN tipo_cliente = 'pagante' AND status_assinatura = 'ativa' THEN
                        CASE 
                            WHEN EXISTS (
                                SELECT 1 FROM enderecos 
                                WHERE enderecos.cliente_id = clientes.id 
                                AND enderecos.cidade ilike (SELECT nome FROM cidades WHERE id = ? LIMIT 1)
                            ) THEN 0
                            ELSE 1
                        END
                    ELSE 2
                END ASC
            ", [$cityId]);
        } else {
            $query->orderByRaw("
                CASE 
                    WHEN tipo_cliente = 'pagante' AND status_assinatura = 'ativa' THEN 0 
                    ELSE 1 
                END ASC
            ");
        }
        
        // Ordenação secundária por nome
        $query->orderBy('nome_fantasia');

        $clientes = $query->paginate($perPage);

        return ClienteResource::collection($clientes);
    }

    /**
     * ✅ Sugestões Inteligentes (Autocomplete)
     */
    public function suggestions(Request $request)
    {
        $q = trim((string) ($request->input('q') ?? ''));
        if (strlen($q) < 2) return response()->json([]);

        // Busca Clientes (Lógica Fuzzy)
        $normalizedQ = trim(preg_replace('/^(o|a|os|as|de|do|da)\s+/i', '', $q));
        $cityId = $request->input('city_id');
        
        $clientes = Cliente::query()
            ->select(['id', 'slug', 'nome_fantasia', 'logo_url', 'tipo_cliente', 'status_assinatura'])
            ->where(function($sub) use ($q, $normalizedQ) {
                // Match direto
                $sub->where('nome_fantasia', 'ilike', "%{$q}%")
                    ->orWhere('nome_fantasia', 'ilike', "%{$normalizedQ}%");
                
                // Similarity (pg_trgm)
                static $canUseSim = null;
                if ($canUseSim === null) {
                    try {
                        DB::select('SELECT similarity(\'a\', \'b\')');
                        $canUseSim = true;
                    } catch (\Exception $e) { $canUseSim = false; }
                }

                if ($canUseSim) {
                    $sub->orWhereRaw("similarity(nome_fantasia, ?) > 0.15", [$normalizedQ]);
                } else {
                    $sub->orWhere('nome_fantasia', 'ilike', substr($normalizedQ, 0, 3) . "%");
                }
            })
            ->where(fn($sub) => $sub->where('status_assinatura', 'ativa')->orWhere('tipo_cliente', 'gratuito'))
            ->when($cityId, function($sq) use ($cityId) {
                $sq->where(function($sub) use ($cityId) {
                    $sub->whereHas('cidadesAtendidas', fn($c) => $c->where('cidades.id', $cityId))
                        ->orWhereHas('enderecos', function($e) use ($cityId) {
                            $city = \App\Models\Cidade::find($cityId);
                            if ($city) $e->where('cidade', 'ilike', "%{$city->nome}%");
                        });
                });
            })
            ->orderByRaw("CASE WHEN tipo_cliente = 'pagante' AND status_assinatura = 'ativa' THEN 0 ELSE 1 END ASC")
            ->limit(5)
            ->get();

        // Busca Segmentos (Categorias)
        $segmentos = Segmento::query()
            ->where('nome', 'ilike', "%{$q}%")
            ->limit(3)
            ->get();

        return response()->json([
            'results' => $clientes->map(fn($c) => [
                'id' => $c->id,
                'slug' => $c->slug,
                'title' => $c->nome_fantasia,
                'image' => $c->logo_url,
                'type' => 'client',
                'priority' => ($c->tipo_cliente === 'pagante' && $c->status_assinatura === 'ativa')
            ]),
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

        $query = Cliente::query();

        // ✅ Lite = listagem otimizada (não traz galeria inteira)
        if ($lite) {
            $query->select([
                'id',
                'nome_fantasia',
                'cpf_cnpj',
                'logo_url',
                'tipo_cliente',
                'status_assinatura',
                'possui_publicidade',
                'seo_keywords',
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

            $query->where(function ($sub) use ($q, $qDigits) {
                $sub->where('nome_fantasia', 'ilike', "%{$q}%")
                    ->orWhere('razao_social', 'ilike', "%{$q}%")
                    ->orWhere('nome_alternativo', 'ilike', "%{$q}%");

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
                $sub->orWhereHas('enderecos', function ($eq) use ($q) {
                    $eq->where('cidade', 'ilike', "%{$q}%")
                       ->orWhere('estado', 'ilike', "%{$q}%")
                       ->orWhere('bairro', 'ilike', "%{$q}%")
                       ->orWhere('rua', 'ilike', "%{$q}%");
                });

                // segmentos
                $sub->orWhereHas('segmentos', function ($sq) use ($q) {
                    $sq->where('segmentos.nome', 'ilike', "%{$q}%");
                });
            });
        }

        // ✅ Ordenação SaaS
        $query->orderByRaw("
            CASE
                WHEN tipo_cliente = 'pagante' AND status_assinatura = 'ativa' THEN 0
                WHEN tipo_cliente = 'pagante' THEN 1
                ELSE 2
            END ASC
        ");
        $query->orderBy('updated_at', 'desc');

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
        $query = Cliente::with(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'cidadesAtendidas', 'galeriaImagens', 'reviews', 'jobOpportunities']);
        
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
            $cpfCnpjRaw = (string) ($request->input('cpf_cnpj') ?? $request->input('cnpj') ?? '');
            $cpfCnpjNormalized = preg_replace('/\D+/', '', $cpfCnpjRaw) ?? '';

            $request->merge([
                'nome_fantasia' => $request->input('nome_fantasia') ?? $request->input('nome'),
                'cpf_cnpj'      => $cpfCnpjNormalized,
                'logo_url'      => $request->input('logo_url') ?? $request->input('logotipo'),
                'video'         => $request->input('video') ?? $request->input('video_link'),
                'portfolio_url' => $request->input('portfolio_url') ?? $request->input('arquivo_midia'),
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

            $request->merge(['redes_sociais' => $redesNormalized]);

            $validated = $request->validate([
                'nome_fantasia' => 'required|string|max:255',

                'cpf_cnpj' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('clientes', 'cpf_cnpj'),
                    function ($attribute, $value, $fail) {
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
                'possui_publicidade'    => 'nullable|boolean',

                'video'         => 'nullable|string|max:500',
                'portfolio_url' => 'nullable|string|max:500',

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

                'endereco'             => 'nullable|array',
                'endereco.cep'         => 'required_with:endereco|string',
                'endereco.estado'      => 'required_with:endereco|string',
                'endereco.cidade'      => 'required_with:endereco|string',
                'endereco.bairro'      => 'required_with:endereco|string',
                'endereco.rua'         => 'required_with:endereco|string',
                'endereco.numero'      => 'required_with:endereco|string',
                'endereco.complemento' => 'nullable|string',

                'contatos'                      => 'nullable|array|min:1',
                'contatos.*.telefone_principal'  => 'nullable|string|max:50',
                'contatos.*.telefone_secundario' => 'nullable|string|max:50',
                'contatos.*.celular'             => 'nullable|string|max:50',
                'contatos.*.telefone_outro'      => 'nullable|string|max:50',
                'contatos.*.whatsapp_selected'   => 'nullable|string|max:50',
                'contatos.*.exibir_tel_principal' => 'nullable|boolean',
                'contatos.*.exibir_tel_secundario' => 'nullable|boolean',
                'contatos.*.exibir_celular'      => 'nullable|boolean',
                'contatos.*.exibir_tel_outro'    => 'nullable|boolean',
                'contatos.*.exibir_email'        => 'nullable|boolean',
                'contatos.*.email_principal'     => 'nullable|email|max:255',
                'contatos.*.email_cobranca'      => 'nullable|email|max:255',
                'contatos.*.site'                => 'nullable|string|max:255',
                'contatos.*.nome_contato'        => 'nullable|string|max:255',

                'redes_sociais'        => 'nullable|array',
                'redes_sociais.*.tipo' => 'required|string|max:50',
                'redes_sociais.*.url'  => 'nullable|string|max:500',

                'logo_url' => 'nullable|string|max:255',
                'horario_atendimento' => 'nullable',

                'generate_seo_keywords' => 'nullable|boolean',
                'seo_keywords_text'     => 'nullable|string',
                'data_fundacao'         => 'nullable|date',
                'google_place_id'       => 'nullable|string|max:255',
                'reviews'               => 'nullable|array',
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
                'possui_publicidade'    => $validated['possui_publicidade'] ?? null,
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

            if (Schema::hasColumn('clientes', 'video')) {
                $clienteData['video'] = $validated['video'] ?? null;
            }
            if (Schema::hasColumn('clientes', 'portfolio_url')) {
                $clienteData['portfolio_url'] = $validated['portfolio_url'] ?? null;
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

            $cliente = Cliente::create($clienteData);

            if (!empty($validated['segmentos'])) {
                $cliente->segmentos()->sync($validated['segmentos']);
            }

            if (!empty($validated['cidades_atendidas'])) {
                $cliente->cidadesAtendidas()->sync($validated['cidades_atendidas']);
            }

            if (!empty($validated['endereco']) && is_array($validated['endereco'])) {
                $cliente->enderecos()->create($validated['endereco']);
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
        Log::info('CLIENTE UPDATE - PAYLOAD RECEBIDO', [
            'cliente_id' => $id,
            'headers' => [
                'content_type' => $request->header('Content-Type'),
                'origin' => $request->header('Origin'),
                'authorization' => $request->header('Authorization') ? 'present' : 'missing',
            ],
            'body' => $request->all(),
        ]);

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
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('clientes', 'cpf_cnpj')->ignore($cliente->id),
                    function ($attribute, $value, $fail) use ($cliente) {
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
                'possui_publicidade'    => 'nullable|boolean',

                'video'         => 'nullable|string|max:500',
                'portfolio_url' => 'nullable|string|max:500',

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

                'endereco'             => 'nullable|array',
                'endereco.cep'         => 'required_with:endereco|string',
                'endereco.estado'      => 'required_with:endereco|string',
                'endereco.cidade'      => 'required_with:endereco|string',
                'endereco.bairro'      => 'required_with:endereco|string',
                'endereco.rua'         => 'required_with:endereco|string',
                'endereco.numero'      => 'required_with:endereco|string',
                'endereco.complemento' => 'nullable|string',

                'contatos'                      => 'nullable|array|min:1',
                'contatos.*.telefone_principal'  => 'nullable|string|max:50',
                'contatos.*.telefone_secundario' => 'nullable|string|max:50',
                'contatos.*.celular'             => 'nullable|string|max:50',
                'contatos.*.telefone_outro'      => 'nullable|string|max:50',
                'contatos.*.whatsapp_selected'   => 'nullable|string|max:50',
                'contatos.*.exibir_tel_principal' => 'nullable|boolean',
                'contatos.*.exibir_tel_secundario' => 'nullable|boolean',
                'contatos.*.exibir_celular'      => 'nullable|boolean',
                'contatos.*.exibir_tel_outro'    => 'nullable|boolean',
                'contatos.*.exibir_email'        => 'nullable|boolean',
                'contatos.*.email_principal'     => 'nullable|email|max:255',
                'contatos.*.email_cobranca'      => 'nullable|email|max:255',
                'contatos.*.site'                => 'nullable|string|max:255',
                'contatos.*.nome_contato'        => 'nullable|string|max:255',

                'redes_sociais'        => 'nullable|array',
                'redes_sociais.*.tipo' => 'required|string|max:50',
                'redes_sociais.*.url'  => 'nullable|string|max:500',

                'logo_url' => 'nullable|string|max:255',
                'horario_atendimento' => 'nullable',

                'generate_seo_keywords' => 'nullable|boolean',
                'seo_keywords_text'     => 'nullable|string',
                'data_fundacao'         => 'nullable|date',
                'google_place_id'       => 'nullable|string|max:255',
                'reviews'               => 'nullable|array',
            ]);

            $generate = $request->boolean('generate_seo_keywords', true);

            DB::beginTransaction();

            $tipoCliente = $validated['tipo_cliente'] ?? ($cliente->tipo_cliente ?? 'gratuito');

            // se não vier status_assinatura, mantém atual; se não existir, define default
            $statusAssinatura = $validated['status_assinatura']
                ?? ($cliente->status_assinatura ?? ($tipoCliente === 'pagante' ? 'pendente' : 'cancelada'));

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
                'possui_publicidade'    => $validated['possui_publicidade'] ?? null,
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

            if (Schema::hasColumn('clientes', 'video')) {
                $clienteData['video'] = $validated['video'] ?? null;
            }

            if (Schema::hasColumn('clientes', 'portfolio_url')) {
                $clienteData['portfolio_url'] = $validated['portfolio_url'] ?? null;
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

            $cliente->update($clienteData);



            // relações pivot
            if (array_key_exists('segmentos', $validated)) {
                $cliente->segmentos()->sync($validated['segmentos'] ?? []);
            }

            if (array_key_exists('cidades_atendidas', $validated)) {
                $cliente->cidadesAtendidas()->sync($validated['cidades_atendidas'] ?? []);
            }

            // endereço: atualiza o primeiro, senão cria
            if (!empty($validated['endereco']) && is_array($validated['endereco'])) {
                $e = $cliente->enderecos()->orderBy('id', 'asc')->first();
                if ($e) {
                    $e->update($validated['endereco']);
                } else {
                    $cliente->enderecos()->create($validated['endereco']);
                }
            }

            // contato: atualiza o primeiro, senão cria
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
                if (Schema::hasColumn('clientes', 'seo_keywords_source') && ($cliente->seo_keywords_source ?? null) !== 'manual') {
                    GenerateSeoKeywordsJob::dispatch($cliente->id)->afterCommit();
                }
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

            if (count($out) >= 20) break;
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
    public function lookupGoogleReviews(Request $request, GooglePlacesService $googleService)
    {
        $placeId = $request->input('place_id');
        if (!$placeId) {
            return response()->json(['success' => false, 'message' => 'Place ID é obrigatório.'], 400);
        }

        try {
            $reviews = $googleService->getReviews($placeId);
            return response()->json(['success' => true, 'reviews' => $reviews]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Erro ao consultar Google.'], 500);
        }
    }

    /**
     * Sincroniza os reviews do Google para um cliente.
     */
    public function getGoogleReviews(string $id, Request $request, GooglePlacesService $googleService)
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
}
