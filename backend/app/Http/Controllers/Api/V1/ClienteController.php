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


class ClienteController extends Controller
{
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
                    $q->select(['id', 'cliente_id', 'email_principal', 'telefone_principal', 'nome_contato'])
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
        $cliente = Cliente::with(['enderecos', 'contatos', 'redesSociais', 'segmentos', 'cidadesAtendidas', 'galeriaImagens'])
            ->findOrFail($id);

        return new ClienteResource($cliente);
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
                'contatos.*.whatsapp_principal'  => 'nullable|boolean',
                'contatos.*.whatsapp_secundario' => 'nullable|boolean',
                'contatos.*.email_principal'     => 'nullable|email|max:255',
                'contatos.*.email_cobranca'      => 'nullable|email|max:255',
                'contatos.*.site'                => 'nullable|string|max:255',
                'contatos.*.nome_contato'        => 'nullable|string|max:255',

                'redes_sociais'        => 'nullable|array',
                'redes_sociais.*.tipo' => 'required|string|max:50',
                'redes_sociais.*.url'  => 'nullable|string|max:500',

                'logo_url' => 'nullable|string|max:255',

                'generate_seo_keywords' => 'nullable|boolean',
                'seo_keywords_text'     => 'nullable|string',
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

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $cliente->load(['enderecos', 'contatos', 'segmentos', 'cidadesAtendidas', 'redesSociais', 'galeriaImagens']),
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
                'contatos.*.whatsapp_principal'  => 'nullable|boolean',
                'contatos.*.whatsapp_secundario' => 'nullable|boolean',
                'contatos.*.email_principal'     => 'nullable|email|max:255',
                'contatos.*.email_cobranca'      => 'nullable|email|max:255',
                'contatos.*.site'                => 'nullable|string|max:255',
                'contatos.*.nome_contato'        => 'nullable|string|max:255',

                'redes_sociais'        => 'nullable|array',
                'redes_sociais.*.tipo' => 'required|string|max:50',
                'redes_sociais.*.url'  => 'nullable|string|max:500',

                'logo_url' => 'nullable|string|max:255',

                'generate_seo_keywords' => 'nullable|boolean',
                'seo_keywords_text'     => 'nullable|string',
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

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $cliente->fresh()->load(['enderecos', 'contatos', 'segmentos', 'cidadesAtendidas', 'redesSociais', 'galeriaImagens']),
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

        $supabaseUrl = rtrim(env('SUPABASE_URL'), '/');
        $supabaseKey = env('SUPABASE_SERVICE_KEY') ?: env('SUPABASE_KEY');
        $bucket = env('SUPABASE_BUCKET', 'clientes-media');

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
                throw new \Exception("COPY failed {$copyResp->status()}: " . $copyResp->body());
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

        $supabaseUrl = rtrim(env('SUPABASE_URL'), '/');
        $supabaseKey = env('SUPABASE_SERVICE_KEY') ?: env('SUPABASE_KEY');
        $bucket = env('SUPABASE_BUCKET', 'clientes-media');

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
                throw new \Exception("COPY failed {$copyResp->status()}: " . $copyResp->body());
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

        // Se não houver usuário autenticado, não grava (evita quebrar qualquer fluxo).
        if (!$actorId) return;

        $req = request();

        $metadata = array_merge([
            'ip' => $req?->ip(),
            'user_agent' => $req?->userAgent(),
            'path' => $req?->path(),
            'method' => $req?->method(),
        ], $metadata);

        AuditLog::create([
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
        // Nunca pode quebrar a ação do usuário por falha de auditoria
        Log::warning('AUDIT_LOG_FAIL', [
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'error' => $e->getMessage(),
        ]);
    }
}




}
