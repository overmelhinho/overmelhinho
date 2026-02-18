<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CampanhaRequest;
use App\Services\CampanhaWizardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CampanhaController extends Controller
{
    private const FIN_AGUARDANDO = 'aguardando_pagamento';
    private const FIN_PAGO = 'pago';
    private const FIN_CORTESIA = 'cortesia';

    private const CAMP_ATIVA = 'ativa';
    private const CAMP_PENDENTE = 'pendente';

    private function normalizeFinanceStatus(?string $s): string
    {
        $v = trim((string) $s);
        if ($v === '') return self::FIN_AGUARDANDO;

        $lower = mb_strtolower($v);

        // já no formato do banco
        if (in_array($lower, [self::FIN_AGUARDANDO, self::FIN_PAGO, self::FIN_CORTESIA], true)) {
            return $lower;
        }

        // aceita formato oficial em UPPER
        $upper = mb_strtoupper($v);
        if ($upper === 'AGUARDANDO_PAGAMENTO') return self::FIN_AGUARDANDO;
        if ($upper === 'PAGO') return self::FIN_PAGO;
        if ($upper === 'CORTESIA') return self::FIN_CORTESIA;

        // fallback seguro
        return self::FIN_AGUARDANDO;
    }

    private function deriveCampaignStatusFromFinance(string $finStatus): string
    {
        if (in_array($finStatus, [self::FIN_PAGO, self::FIN_CORTESIA], true)) {
            return self::CAMP_ATIVA;
        }
        return self::CAMP_PENDENTE;
    }

    private function normalizeKeyword(string $original): string
    {
        $v = trim($original);
        $v = mb_strtolower($v);

        // remover acentos sem depender de ext intl
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $v);
        if (is_string($ascii) && $ascii !== '') {
            $v = $ascii;
        }

        // colapsa espaços
        $v = preg_replace('/\s+/', ' ', $v) ?? $v;

        return trim($v);
    }

    public function index(Request $request)
    {
        $q = DB::table('campanhas as c')
            ->join('clientes as cli', 'cli.id', '=', 'c.cliente_id');

        // Join financeiro apenas se existir
        $hasFinanceiro = Schema::hasTable('campanha_financeiro');
        if ($hasFinanceiro) {
            $q->leftJoin('campanha_financeiro as fin', 'fin.campanha_id', '=', 'c.id');
        }

        // Select padrão
        $select = [
            'c.id',
            'c.nome',
            'c.tipo',
            'c.status',
            'c.data_inicio',
            'c.data_fim',
            'c.valor_total',
            'c.created_at',
            'cli.id as cliente_id',
            'cli.nome_fantasia as cliente_nome',
        ];

        if ($hasFinanceiro) {
            $select[] = 'fin.status as financeiro_status';
            $select[] = 'fin.valor as financeiro_valor';
            $select[] = 'fin.vencimento as financeiro_vencimento';
        } else {
            $select[] = DB::raw('NULL as financeiro_status');
            $select[] = DB::raw('NULL as financeiro_valor');
            $select[] = DB::raw('NULL as financeiro_vencimento');
        }

        $q->select($select);

        // Filtros
        if ($request->filled('cliente_id')) {
            $q->where('c.cliente_id', (int) $request->query('cliente_id'));
        }

        if ($request->filled('status')) {
            $q->where('c.status', $request->query('status'));
        }

        if ($request->filled('tipo')) {
            $q->where('c.tipo', $request->query('tipo'));
        }

        if ($request->filled('data_inicio')) {
            $q->whereDate('c.data_inicio', '>=', $request->query('data_inicio'));
        }

        if ($request->filled('data_fim')) {
            $q->whereDate('c.data_fim', '<=', $request->query('data_fim'));
        }

        $q->orderByDesc('c.created_at');

        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);

        return response()->json([
            'data' => $q->paginate($perPage),
        ]);
    }

    public function store(CampanhaRequest $request, CampanhaWizardService $service)
    {
        // ✅ injeta actor_user_id do usuário logado (sem depender do frontend)
        $validated = $request->validated();
        $validated['actor_user_id'] = (int) optional($request->user())->id;

        $result = $service->create($validated);

        return response()->json([
            'message' => 'Campanha criada com sucesso.',
            'data' => [
                'id' => $result['id'],
            ],
        ], 201);
    }

    public function show(Request $request, int $campanha)
    {
        $hasFinanceiro = Schema::hasTable('campanha_financeiro');

        $q = DB::table('campanhas as c')
            ->join('clientes as cli', 'cli.id', '=', 'c.cliente_id')
            ->where('c.id', $campanha);

        if ($hasFinanceiro) {
            $q->leftJoin('campanha_financeiro as fin', 'fin.campanha_id', '=', 'c.id');
        }

        $select = [
            'c.*',
            'cli.nome_fantasia as cliente_nome',
        ];

        if ($hasFinanceiro) {
            $select[] = 'fin.status as financeiro_status';
            $select[] = 'fin.forma as financeiro_forma';
            $select[] = 'fin.valor as financeiro_valor';
            $select[] = 'fin.vencimento as financeiro_vencimento';
            $select[] = 'fin.pago_em as financeiro_pago_em';
        } else {
            $select[] = DB::raw('NULL as financeiro_status');
            $select[] = DB::raw('NULL as financeiro_forma');
            $select[] = DB::raw('NULL as financeiro_valor');
            $select[] = DB::raw('NULL as financeiro_vencimento');
            $select[] = DB::raw('NULL as financeiro_pago_em');
        }

        $c = $q->select($select)->first();

        if (!$c) {
            return response()->json(['message' => 'Campanha não encontrada.'], 404);
        }

        /**
         * ✅ placements: se estiver salvo como JSON string, devolve array para o frontend marcar corretamente
         */
        if (property_exists($c, 'placements') && is_string($c->placements)) {
            $decoded = json_decode($c->placements, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $c->placements = $decoded;
            }
        }

        if (property_exists($c, 'placements_json') && is_string($c->placements_json)) {
            $decoded = json_decode($c->placements_json, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                // padroniza em placements para o wizard
                $c->placements = $decoded;
            }
        }

        // Cidades
        $cidades = collect([]);
        if (Schema::hasTable('campanha_cidades') && Schema::hasTable('cidades')) {
            $cidades = DB::table('campanha_cidades as cc')
                ->join('cidades as cid', 'cid.id', '=', 'cc.cidade_id')
                ->where('cc.campanha_id', $campanha)
                ->select(['cid.id', 'cid.nome', 'cid.uf'])
                ->orderBy('cid.nome')
                ->get();
        }

        // Segmentos
        $segmentos = collect([]);
        if (Schema::hasTable('campanha_segmentos') && Schema::hasTable('segmentos')) {
            $segmentos = DB::table('campanha_segmentos as cs')
                ->join('segmentos as s', 's.id', '=', 'cs.segmento_id')
                ->where('cs.campanha_id', $campanha)
                ->select(['s.id', 's.nome'])
                ->orderBy('s.nome')
                ->get();
        }

        // Keywords
        $keywords = collect([]);
        if (Schema::hasTable('campanha_keywords')) {
            $keywords = DB::table('campanha_keywords')
                ->where('campanha_id', $campanha)
                ->select(['id', 'keyword_original', 'keyword_normalizada'])
                ->orderBy('keyword_normalizada')
                ->get();
        }

        // Mídias
        $midias = collect([]);
        if (Schema::hasTable('campanha_midias')) {
            $midias = DB::table('campanha_midias')
                ->where('campanha_id', $campanha)
                ->select(['id', 'tipo', 'versao', 'status', 'desktop_url', 'mobile_url', 'meta_json', 'created_at'])
                ->orderBy('tipo')
                ->orderByDesc('versao')
                ->get();

            // ✅ Garantir meta_json como objeto/array (não string)
            $midias = $midias->map(function ($m) {
                if (!property_exists($m, 'meta_json')) return $m;

                if ($m->meta_json === null || $m->meta_json === '') {
                    $m->meta_json = null;
                    return $m;
                }

                if (is_array($m->meta_json) || is_object($m->meta_json)) {
                    return $m;
                }

                if (is_string($m->meta_json)) {
                    $decoded = json_decode($m->meta_json, true);
                    $m->meta_json = (json_last_error() === JSON_ERROR_NONE) ? $decoded : null;
                }

                return $m;
            });
        }

        // ✅ Mídia ativa derivada (mantém compatibilidade)
        $midiasAtivas = [];

        if ($midias->isNotEmpty()) {
            $tipos = $midias->pluck('tipo')->filter()->unique()->values();

            foreach ($tipos as $tipo) {
                $desktopAtiva = $midias
                    ->filter(fn($m) => (string) ($m->tipo ?? '') === (string) $tipo)
                    ->filter(fn($m) => (string) ($m->status ?? '') === 'publicado')
                    ->filter(fn($m) => !empty($m->desktop_url))
                    ->sortByDesc(fn($m) => (int) ($m->versao ?? 0))
                    ->sortByDesc(fn($m) => (int) ($m->id ?? 0))
                    ->values()
                    ->first();

                $mobileAtiva = $midias
                    ->filter(fn($m) => (string) ($m->tipo ?? '') === (string) $tipo)
                    ->filter(fn($m) => (string) ($m->status ?? '') === 'publicado')
                    ->filter(fn($m) => !empty($m->mobile_url))
                    ->sortByDesc(fn($m) => (int) ($m->versao ?? 0))
                    ->sortByDesc(fn($m) => (int) ($m->id ?? 0))
                    ->values()
                    ->first();

                $midiasAtivas[$tipo] = [
                    'desktop' => $desktopAtiva ?: null,
                    'mobile' => $mobileAtiva ?: null,
                ];
            }
        }

        // Tickets (somente se existir tabela e coluna campanha_id)
        $tickets = collect([]);
        if (Schema::hasTable('tickets') && Schema::hasColumn('tickets', 'campanha_id')) {
            $tickets = DB::table('tickets')
                ->where('campanha_id', $campanha)
                ->select(['id', 'setor', 'status', 'titulo', 'prioridade', 'assignee_id', 'due_at', 'created_at'])
                ->orderByDesc('created_at')
                ->get();
        }

        return response()->json([
            'data' => [
                'campanha' => $c,
                'cidades' => $cidades,
                'segmentos' => $segmentos,
                'keywords' => $keywords,
                'midias' => $midias,
                'midias_ativas' => $midiasAtivas,
                'tickets' => $tickets,
            ],
        ]);
    }

    /**
     * ✅ UPDATE REAL (remove 501)
     * - Atualiza campanha base
     * - Sincroniza cidades (campanha_cidades) quando enviado
     * - Sincroniza keywords (campanha_keywords) quando enviado (normaliza/sem duplicatas)
     * - Upsert financeiro (campanha_financeiro) quando existir tabela
     * - Salva placements se existir coluna (placements ou placements_json)
     * - Atualiza status derivando do financeiro (pago/cortesia => ativa | aguardando => pendente)
     */
    public function update(CampanhaRequest $request, int $campanha)
    {
        $validated = $request->validated();
        $actorId = (int) optional($request->user())->id;

        // garante que existe
        $exists = DB::table('campanhas')->where('id', $campanha)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Campanha não encontrada.'], 404);
        }

        $now = now();

        // financeiro (pode ser null)
        $financeiro = $validated['financeiro'] ?? null;

        // status derivado do financeiro (se vier)
        $derivedStatus = null;
        if (is_array($financeiro) && array_key_exists('status', $financeiro)) {
            $finStatusNorm = $this->normalizeFinanceStatus($financeiro['status'] ?? null);
            $derivedStatus = $this->deriveCampaignStatusFromFinance($finStatusNorm);
        }

        // payload base
        $campUpdate = [
            'cliente_id' => (int) $validated['cliente_id'],
            'nome' => (string) $validated['nome'],
            'tipo' => (string) $validated['tipo'],
            'origem' => $validated['origem'] ?? null,
            'data_inicio' => $validated['data_inicio'],
            'data_fim' => $validated['data_fim'],
            'updated_at' => $now,
        ];

        if ($derivedStatus !== null && Schema::hasColumn('campanhas', 'status')) {
            $campUpdate['status'] = $derivedStatus;
        }

        if (Schema::hasColumn('campanhas', 'updated_by')) {
            $campUpdate['updated_by'] = $actorId > 0 ? $actorId : null;
        }

        // placements (se existir coluna)
        $placements = $validated['placements'] ?? null;
        if (is_array($placements)) {
            $json = json_encode(array_values($placements), JSON_UNESCAPED_UNICODE);

            if (Schema::hasColumn('campanhas', 'placements')) {
                $campUpdate['placements'] = $json;
            } elseif (Schema::hasColumn('campanhas', 'placements_json')) {
                $campUpdate['placements_json'] = $json;
            }
        }

        // plano_id (se vier e existir)
        if (array_key_exists('plano_id', $validated) && Schema::hasColumn('campanhas', 'plano_id')) {
            $campUpdate['plano_id'] = $validated['plano_id'];
        }

        // cidades/keywords (podem ser null quando global)
        $cidadesIds = $validated['cidades_ids'] ?? null;
        $keywords = $validated['keywords'] ?? null;

        DB::beginTransaction();
        try {
            // update campanha
            DB::table('campanhas')->where('id', $campanha)->update($campUpdate);

            // sync cidades (se tabela existir e input enviado)
            if (Schema::hasTable('campanha_cidades') && is_array($cidadesIds)) {
                DB::table('campanha_cidades')->where('campanha_id', $campanha)->delete();

                $rows = [];
                foreach ($cidadesIds as $cid) {
                    $cidNum = (int) $cid;
                    if ($cidNum <= 0) continue;

                    $row = [
                        'campanha_id' => $campanha,
                        'cidade_id' => $cidNum,
                    ];

                    if (Schema::hasColumn('campanha_cidades', 'created_at')) $row['created_at'] = $now;
                    if (Schema::hasColumn('campanha_cidades', 'updated_at')) $row['updated_at'] = $now;

                    $rows[] = $row;
                }

                if (!empty($rows)) {
                    DB::table('campanha_cidades')->insert($rows);
                }
            }

            // sync keywords (se tabela existir e input enviado)
            if (Schema::hasTable('campanha_keywords') && is_array($keywords)) {
                DB::table('campanha_keywords')->where('campanha_id', $campanha)->delete();

                $rows = [];
                $seen = [];

                foreach ($keywords as $kw) {
                    $kw = trim((string) $kw);
                    if ($kw === '') continue;

                    $norm = $this->normalizeKeyword($kw);
                    if ($norm === '') continue;
                    if (isset($seen[$norm])) continue;
                    $seen[$norm] = true;

                    $row = [
                        'campanha_id' => $campanha,
                        'keyword_original' => $kw,
                        'keyword_normalizada' => $norm,
                    ];

                    if (Schema::hasColumn('campanha_keywords', 'created_at')) $row['created_at'] = $now;
                    if (Schema::hasColumn('campanha_keywords', 'updated_at')) $row['updated_at'] = $now;

                    $rows[] = $row;
                }

                if (!empty($rows)) {
                    DB::table('campanha_keywords')->insert($rows);
                }
            }

            // upsert financeiro (se tabela existir e payload enviado)
            if (Schema::hasTable('campanha_financeiro') && is_array($financeiro)) {
                $statusNorm = $this->normalizeFinanceStatus($financeiro['status'] ?? null);

                $finData = [
                    'campanha_id' => $campanha,
                    'status' => $statusNorm,
                    'forma' => $financeiro['forma'] ?? null,
                    'valor' => array_key_exists('valor', $financeiro) ? $financeiro['valor'] : null,
                    'vencimento' => $financeiro['vencimento'] ?? null,
                    'pago_em' => $financeiro['pago_em'] ?? null,
                    'updated_at' => $now,
                ];

                if (Schema::hasColumn('campanha_financeiro', 'observacao')) {
                    $finData['observacao'] = $financeiro['observacao'] ?? null;
                }

                if (Schema::hasColumn('campanha_financeiro', 'created_by') && $actorId > 0) {
                    // no update não força created_by; só se for insert
                }

                $hasRow = DB::table('campanha_financeiro')->where('campanha_id', $campanha)->exists();
                if ($hasRow) {
                    DB::table('campanha_financeiro')->where('campanha_id', $campanha)->update($finData);
                } else {
                    if (Schema::hasColumn('campanha_financeiro', 'created_at')) $finData['created_at'] = $now;
                    if (Schema::hasColumn('campanha_financeiro', 'created_by')) $finData['created_by'] = $actorId > 0 ? $actorId : null;

                    DB::table('campanha_financeiro')->insert($finData);
                }

                // ✅ garante consistência do status também (se a coluna existir)
                if ($derivedStatus !== null && Schema::hasColumn('campanhas', 'status')) {
                    DB::table('campanhas')->where('id', $campanha)->update([
                        'status' => $derivedStatus,
                        'updated_at' => $now,
                    ]);
                }
            }


	   // audit log (SAFE: só insere colunas que existem)
if (Schema::hasTable('audit_logs') && $actorId > 0) {
    $actorExists = Schema::hasTable('users')
        ? DB::table('users')->where('id', $actorId)->exists()
        : false;

    if ($actorExists) {
        $cols = Schema::getColumnListing('audit_logs');

        $row = [
            'actor_user_id' => $actorId,
            'action' => 'campanha.updated',
            'entity_type' => 'campanha',
            'entity_id' => $campanha,
            'cliente_id' => (int) $validated['cliente_id'],
            'lead_id' => null,
            'field_changes' => json_encode(['updated' => true], JSON_UNESCAPED_UNICODE),
            'metadata' => json_encode(['source' => 'wizard'], JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $payload = [];
        foreach ($row as $k => $v) {
            if (in_array($k, $cols, true)) {
                $payload[$k] = $v;
            }
        }

        // garante created_at se existir
        if (in_array('created_at', $cols, true) && !isset($payload['created_at'])) {
            $payload['created_at'] = now();
        }
        // updated_at só se existir
        if (in_array('updated_at', $cols, true) && !isset($payload['updated_at'])) {
            $payload['updated_at'] = now();
        }

        DB::table('audit_logs')->insert($payload);
    }
}



            DB::commit();

            return response()->json([
                'message' => 'Campanha atualizada com sucesso.',
                'data' => [
                    'id' => $campanha,
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return response()->json([
                'message' => 'Erro ao atualizar campanha.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function encerrar(Request $request, int $campanha)
    {
        $actorId = (int) optional($request->user())->id;

        $updated = DB::table('campanhas')
            ->where('id', $campanha)
            ->update([
                'status' => 'encerrada',
                'updated_by' => $actorId > 0 ? $actorId : null,
                'updated_at' => now(),
            ]);

        if (!$updated) {
            return response()->json(['message' => 'Campanha não encontrada.'], 404);
        }

        // Audit (somente se existir tabela e actor válido existente)
        if (Schema::hasTable('audit_logs') && $actorId > 0) {
            $actorExists = Schema::hasTable('users')
                ? DB::table('users')->where('id', $actorId)->exists()
                : false;

            if ($actorExists) {
                DB::table('audit_logs')->insert([
                    'actor_user_id' => $actorId,
                    'action' => 'campanha.closed',
                    'entity_type' => 'campanha',
                    'entity_id' => $campanha,
                    'cliente_id' => null,
                    'lead_id' => null,
                    'field_changes' => json_encode(['status' => ['from' => null, 'to' => 'encerrada']], JSON_UNESCAPED_UNICODE),
                    'metadata' => json_encode(['source' => 'manual'], JSON_UNESCAPED_UNICODE),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return response()->json(['message' => 'Campanha encerrada.']);
    }

    public function renovar(Request $request, int $campanha)
    {
        return response()->json(['message' => 'Em breve.'], 501);
    }
}
