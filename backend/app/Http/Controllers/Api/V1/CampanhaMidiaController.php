<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CampanhaMidiaController extends Controller
{
    public function index(Request $request, int $campanha)
    {
        if (!Schema::hasTable('campanha_midias')) {
            return response()->json(['data' => []]);
        }

        $campanhaExists = DB::table('campanhas')->where('id', $campanha)->exists();
        if (!$campanhaExists) {
            return response()->json(['message' => 'Campanha não encontrada.'], 404);
        }

        $q = DB::table('campanha_midias')
            ->where('campanha_id', $campanha)
            ->select([
                'id',
                'campanha_id',
                'tipo',
                'versao',
                'status',
                'desktop_url',
                'mobile_url',
                'meta_json',
                'created_by',
                'approved_by',
                'created_at',
                'updated_at',
            ])
            ->orderBy('tipo')
            ->orderByDesc('versao')
            ->orderByDesc('id');

        if ($request->filled('tipo')) {
            $q->where('tipo', (string) $request->query('tipo'));
        }

        if ($request->filled('status')) {
            $q->where('status', (string) $request->query('status'));
        }

        $rows = collect($q->get())->map(fn ($m) => $this->normalizeMetaJson($m));

        return response()->json(['data' => $rows]);
    }

    /**
     * ✅ C1) Mídias ativas derivadas por (tipo + slot)
     * GET /v1/campanhas/{campanha}/midias/ativas
     *
     * Critério:
     * - somente status=publicado
     * - desktop => desktop_url preenchida
     * - mobile  => mobile_url preenchida
     * - maior versao; desempate por maior id
     */
    public function ativas(Request $request, int $campanha)
    {
        if (!Schema::hasTable('campanha_midias')) {
            return response()->json(['data' => []]);
        }

        $campanhaExists = DB::table('campanhas')->where('id', $campanha)->exists();
        if (!$campanhaExists) {
            return response()->json(['message' => 'Campanha não encontrada.'], 404);
        }

        $rows = collect(DB::table('campanha_midias')
            ->where('campanha_id', $campanha)
            ->where('status', 'publicado')
            ->select(['id', 'tipo', 'versao', 'status', 'desktop_url', 'mobile_url', 'meta_json', 'created_at'])
            ->orderBy('tipo')
            ->orderByDesc('versao')
            ->orderByDesc('id')
            ->get())->map(fn ($m) => $this->normalizeMetaJson($m));

        $midiasAtivas = [];

        $tipos = $rows->pluck('tipo')->filter()->unique()->values();

	foreach ($tipos as $tipo) {
    $baseTipo = $rows->filter(fn ($m) => (string) ($m->tipo ?? '') === (string) $tipo);

    // DESKTOP: primeiro tenta a flag ativa_desktop=true, senão fallback (última publicada)
    $desktopFlagged = $baseTipo
        ->filter(fn ($m) => !empty($m->desktop_url))
        ->filter(fn ($m) => is_array($m->meta_json) && (($m->meta_json['ativa_desktop'] ?? false) === true))
        ->sortByDesc(fn ($m) => (int) ($m->versao ?? 0))
        ->sortByDesc(fn ($m) => (int) ($m->id ?? 0))
        ->values()
        ->first();

    $desktopFallback = $baseTipo
        ->filter(fn ($m) => !empty($m->desktop_url))
        ->sortByDesc(fn ($m) => (int) ($m->versao ?? 0))
        ->sortByDesc(fn ($m) => (int) ($m->id ?? 0))
        ->values()
        ->first();

    // MOBILE: primeiro tenta a flag ativa_mobile=true, senão fallback (última publicada)
    $mobileFlagged = $baseTipo
        ->filter(fn ($m) => !empty($m->mobile_url))
        ->filter(fn ($m) => is_array($m->meta_json) && (($m->meta_json['ativa_mobile'] ?? false) === true))
        ->sortByDesc(fn ($m) => (int) ($m->versao ?? 0))
        ->sortByDesc(fn ($m) => (int) ($m->id ?? 0))
        ->values()
        ->first();

    $mobileFallback = $baseTipo
        ->filter(fn ($m) => !empty($m->mobile_url))
        ->sortByDesc(fn ($m) => (int) ($m->versao ?? 0))
        ->sortByDesc(fn ($m) => (int) ($m->id ?? 0))
        ->values()
        ->first();

    $midiasAtivas[$tipo] = [
        'desktop' => $desktopFlagged ?: ($desktopFallback ?: null),
        'mobile'  => $mobileFlagged  ?: ($mobileFallback  ?: null),
    ];
}



        return response()->json(['data' => $midiasAtivas]);
    }

    /**
     * ✅ C2) Detalhe de uma mídia
     * GET /v1/campanhas/{campanha}/midias/{midia}
     */
    public function showMidia(Request $request, int $campanha, int $midia)
    {
        if (!Schema::hasTable('campanha_midias')) {
            abort(501, 'Tabela campanha_midias não existe neste ambiente.');
        }

        $row = DB::table('campanha_midias')
            ->where('id', $midia)
            ->where('campanha_id', $campanha)
            ->first([
                'id',
                'campanha_id',
                'tipo',
                'versao',
                'status',
                'desktop_url',
                'mobile_url',
                'meta_json',
                'created_by',
                'approved_by',
                'created_at',
                'updated_at',
            ]);

        if (!$row) {
            return response()->json(['success' => false, 'message' => 'Mídia não encontrada para esta campanha.'], 404);
        }

        $row = $this->normalizeMetaJson($row);

        return response()->json([
            'success' => true,
            'data' => $row,
        ]);
    }

    /**
     * ✅ C3) Arquivar mídia (soft delete)
     * DELETE /v1/campanhas/{campanha}/midias/{midia}
     *
     * - muda status -> arquivado (respeitando transição)
     * - log no ticket (safe)
     * - audit (safe)
     * - NÃO remove arquivo do Supabase (apenas arquiva registro)
     */
    public function destroyMidia(Request $request, int $campanha, int $midia)
    {
        if (!Schema::hasTable('campanha_midias')) {
            abort(501, 'Tabela campanha_midias não existe neste ambiente.');
        }

        $row = DB::table('campanha_midias')
            ->where('id', $midia)
            ->where('campanha_id', $campanha)
            ->first();

        if (!$row) {
            return response()->json(['success' => false, 'message' => 'Mídia não encontrada para esta campanha.'], 404);
        }

        $validated = $request->validate([
            'comment' => 'nullable|string|max:1000',
        ]);

        $actorId = auth()->id();
        $now = now();

        $before = (array) $row;
        $currentStatus = (string) ($row->status ?? 'rascunho');
        $targetStatus = 'arquivado';

        if ($targetStatus !== $currentStatus && !$this->canTransition($currentStatus, $targetStatus)) {
            return response()->json([
                'success' => false,
                'message' => "Transição de status inválida: {$currentStatus} → {$targetStatus}",
                'data' => [
                    'from' => $currentStatus,
                    'to' => $targetStatus,
                    'allowed_next' => $this->allowedNextStatuses($currentStatus),
                ],
            ], 422);
        }

        try {
            DB::transaction(function () use ($campanha, $midia, $now) {
                DB::table('campanha_midias')
                    ->where('id', $midia)
                    ->where('campanha_id', $campanha)
                    ->update([
                        'status' => 'arquivado',
                        'updated_at' => $now,
                    ]);
            });

            $afterRow = DB::table('campanha_midias')
                ->where('id', $midia)
                ->where('campanha_id', $campanha)
                ->first();

            $afterRow = $this->normalizeMetaJson($afterRow);

            // Audit (safe)
            $this->audit(
                action: 'archive',
                entityType: 'campanha_midia',
                entityId: (int) $midia,
                fieldChanges: $this->buildFieldChanges($before, $afterRow),
                clienteId: null,
                leadId: null,
                metadata: [
                    'source' => 'destroy-midia',
                    'campanha_id' => $campanha,
                ]
            );

            // Log no ticket (safe)
            $this->logTicketForMidiaChange(
                campanhaId: $campanha,
                midiaId: $midia,
                actorId: $actorId ? (int) $actorId : null,
                status: 'arquivado',
                comment: $validated['comment'] ?? 'Mídia arquivada'
            );

            return response()->json([
                'success' => true,
                'data' => $afterRow,
            ]);
        } catch (QueryException $e) {
            Log::error('CAMPANHA_MIDIA_ARCHIVE_DB_FAIL', [
                'campanha_id' => $campanha,
                'midia_id' => $midia,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            Log::error('CAMPANHA_MIDIA_ARCHIVE_FAIL', [
                'campanha_id' => $campanha,
                'midia_id' => $midia,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ Update de mídia (status/aprovação/meta_json) + log no ticket
     * PATCH /v1/campanhas/{campanha}/midias/{midia}
     *
     * Regras:
     * - valida transições de status (não permite saltos indevidos)
     * - não bloqueia update de meta_json/comment quando status não muda
     * - ✅ (B) ao publicar, auto-conclui ticket aberto (safe)
     */
    public function updateMidia(Request $request, int $campanha, int $midia)
    {
        if (!Schema::hasTable('campanha_midias')) {
            abort(501, 'Tabela campanha_midias não existe neste ambiente.');
        }

        $row = DB::table('campanha_midias')
            ->where('id', $midia)
            ->where('campanha_id', $campanha)
            ->first();

        if (!$row) {
            return response()->json(['success' => false, 'message' => 'Mídia não encontrada para esta campanha.'], 404);
        }

        // Status permitidos (mínimo seguro)
        $allowedStatus = [
            'rascunho',
            'em_revisao',
            'aprovado',
            'reprovado',
            'publicado',
            'arquivado',
        ];

        $validated = $request->validate([
            'status' => 'nullable|string|max:30|in:' . implode(',', $allowedStatus),
            'approved' => 'nullable|boolean', // quando true, seta approved_by e força aprovado se status não vier
            'meta_json' => 'nullable|array',
            'comment' => 'nullable|string|max:1000',
        ]);

        $actorId = auth()->id();
        $now = now();

        $before = (array) $row;
        $currentStatus = (string) ($row->status ?? 'rascunho');

        $update = [];

        // 1) Status explícito
        if (array_key_exists('status', $validated) && $validated['status'] !== null) {
            $targetStatus = (string) $validated['status'];

            // valida transição somente se realmente mudar
            if ($targetStatus !== $currentStatus) {
                if (!$this->canTransition($currentStatus, $targetStatus)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Transição de status inválida: {$currentStatus} → {$targetStatus}",
                        'data' => [
                            'from' => $currentStatus,
                            'to' => $targetStatus,
                            'allowed_next' => $this->allowedNextStatuses($currentStatus),
                        ],
                    ], 422);
                }
            }

            $update['status'] = $targetStatus;
        }

        // 2) meta_json (permite limpar: null)
        if (array_key_exists('meta_json', $validated)) {
            $update['meta_json'] = $validated['meta_json'] !== null
                ? $this->jsonbRaw($validated['meta_json'])
                : null;
        }

        // 3) approved=true -> seta approved_by e força status=aprovado se status não veio
        if (array_key_exists('approved', $validated) && $validated['approved'] === true) {
            if ($actorId) {
                $update['approved_by'] = (int) $actorId;
            }

            if (!array_key_exists('status', $update)) {
                // vai tentar mudar para aprovado respeitando transição
                $targetStatus = 'aprovado';
                if ($targetStatus !== $currentStatus && !$this->canTransition($currentStatus, $targetStatus)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Transição de status inválida: {$currentStatus} → {$targetStatus}",
                        'data' => [
                            'from' => $currentStatus,
                            'to' => $targetStatus,
                            'allowed_next' => $this->allowedNextStatuses($currentStatus),
                        ],
                    ], 422);
                }
                $update['status'] = $targetStatus;
            }
        }

        // Se nada pra atualizar e não tem comment, devolve o atual normalizado
        if (empty($update) && empty($validated['comment'])) {
            $current = $this->normalizeMetaJson($row);
            return response()->json([
                'success' => true,
                'data' => $current,
            ]);
        }

        // Atualiza DB
        try {
            DB::transaction(function () use ($campanha, $midia, $update, $now) {
                if (!empty($update)) {
                    $update['updated_at'] = $now;

                    DB::table('campanha_midias')
                        ->where('id', $midia)
                        ->where('campanha_id', $campanha)
                        ->update($update);
                }
            });

            $afterRow = DB::table('campanha_midias')
                ->where('id', $midia)
                ->where('campanha_id', $campanha)
                ->first();

            $afterRow = $this->normalizeMetaJson($afterRow);

            // ✅ (B) Auto-concluir ticket ao publicar (somente na transição real para publicado)
            $beforeStatus = (string) ($before['status'] ?? 'rascunho');
            $afterStatus = (string) ($afterRow->status ?? $beforeStatus);

            if ($beforeStatus !== 'publicado' && $afterStatus === 'publicado') {
                $this->autoConcludeTicketOnPublish(
                    campanhaId: $campanha,
                    midiaId: $midia,
                    actorId: $actorId ? (int) $actorId : null
                );
            }

            // Audit (safe)
            $this->audit(
                action: 'update',
                entityType: 'campanha_midia',
                entityId: (int) $midia,
                fieldChanges: $this->buildFieldChanges($before, $afterRow),
                clienteId: null,
                leadId: null,
                metadata: [
                    'source' => 'update-midia',
                    'campanha_id' => $campanha,
                ]
            );

            // Log no ticket (safe)
            $this->logTicketForMidiaChange(
                campanhaId: $campanha,
                midiaId: $midia,
                actorId: $actorId ? (int) $actorId : null,
                status: $update['status'] ?? null,
                comment: $validated['comment'] ?? null
            );

            return response()->json([
                'success' => true,
                'data' => $afterRow,
            ]);
        } catch (QueryException $e) {
            Log::error('CAMPANHA_MIDIA_UPDATE_DB_FAIL', [
                'campanha_id' => $campanha,
                'midia_id' => $midia,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            Log::error('CAMPANHA_MIDIA_UPDATE_FAIL', [
                'campanha_id' => $campanha,
                'midia_id' => $midia,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ Commit temp -> definitivo (Supabase copy + delete temp SAFE)
     * ✅ (A) Bloqueia criar mídia já como "publicado" via commit-temp (evita bypass de workflow)
     */
    public function commitTemp(Request $request, int $campanha)
    {
        if (!Schema::hasTable('campanha_midias')) {
            abort(501, 'Tabela campanha_midias não existe neste ambiente.');
        }

        $campanhaRow = DB::table('campanhas')->where('id', $campanha)->first(['id', 'cliente_id', 'nome']);
        if (!$campanhaRow) {
            return response()->json(['message' => 'Campanha não encontrada.'], 404);
        }

        // ✅ status permitido no commit-temp (sem "publicado" para não burlar o fluxo)
        $allowedCommitStatus = [
            'rascunho',
            'em_revisao',
            'aprovado',
            'reprovado',
            'publicado',
            'arquivado',
        ];

        $data = $request->validate([
            'temp_path' => 'required|string',
            'tipo' => 'required|string|max:50',
            'slot' => 'required|string|in:desktop,mobile',
            'status' => 'nullable|string|max:30|in:' . implode(',', $allowedCommitStatus),
            'meta_json' => 'nullable|array',
        ]);

        $supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $supabaseKey = config('services.supabase.service_role_key') ?: config('services.supabase.key');
        $bucket = config('services.supabase.bucket', 'clientes-media');

        $input = trim((string) $data['temp_path']);
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
                'message' => "temp_path inválido: {$tempPath}",
            ], 422);
        }

        $tipo = trim((string) $data['tipo']);
        $tipo = $tipo !== '' ? preg_replace('/[^a-zA-Z0-9_-]+/', '', $tipo) : 'midia';

        $filename = basename($tempPath);
        $destPath = "campanhas/{$campanha}/midias/{$tipo}/{$filename}";
        $finalUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$destPath}";

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

            if ($copyResp->failed()) {
                $copyData = $copyResp->json();
                if ($copyResp->status() === 409 || $copyResp->status() === 400) {
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
        } catch (\Throwable $e) {
            Log::error('COMMIT_CAMPANHA_MIDIA_COPY_FAIL', [
                'campanha_id' => $campanha,
                'temp_path' => $tempPath,
                'dest_path' => $destPath,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }

        $actorId = auth()->id();
        $status = $data['status'] ?? 'rascunho';
        $slot = $data['slot'];

        try {
            $id = DB::transaction(function () use ($campanha, $tipo, $status, $slot, $finalUrl, $actorId, $data) {
                $now = now();

                $maxVersao = (int) DB::table('campanha_midias')
                    ->where('campanha_id', $campanha)
                    ->where('tipo', $tipo)
                    ->max('versao');

                $versao = max(1, $maxVersao + 1);

                $insert = [
                    'campanha_id' => $campanha,
                    'tipo' => $tipo,
                    'versao' => $versao,
                    'status' => $status,
                    'desktop_url' => null,
                    'mobile_url' => null,
                    'meta_json' => array_key_exists('meta_json', $data) ? $this->jsonbRaw($data['meta_json']) : null,
                    'created_by' => $actorId ? (int) $actorId : null,
                    'approved_by' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($slot === 'desktop') $insert['desktop_url'] = $finalUrl;
                if ($slot === 'mobile')  $insert['mobile_url']  = $finalUrl;

                return (int) DB::table('campanha_midias')->insertGetId($insert);
            });

            $row = DB::table('campanha_midias')->where('id', $id)->first();
            $row = $this->normalizeMetaJson($row);

            $this->audit(
                action: 'upload',
                entityType: 'campanha_midia',
                entityId: (int) $id,
                fieldChanges: [
                    'campanha_id' => ['from' => null, 'to' => (int) $campanha],
                    'tipo' => ['from' => null, 'to' => $tipo],
                    'versao' => ['from' => null, 'to' => (int) ($row->versao ?? null)],
                    $slot === 'desktop' ? 'desktop_url' : 'mobile_url' => ['from' => null, 'to' => $finalUrl],
                ],
                clienteId: (int) ($campanhaRow->cliente_id ?? 0),
                metadata: [
                    'dest_path' => $destPath,
                    'bucket' => $bucket,
                    'slot' => $slot,
                    'source' => 'commit-temp',
                ]
            );

            try {
                $delUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}";
                $delResp = Http::withHeaders([
                    'apikey' => $supabaseKey,
                    'Authorization' => "Bearer {$supabaseKey}",
                    'Content-Type' => 'application/json',
                ])->delete($delUrl, ['prefixes' => [$tempPath]]);

                if ($delResp->failed()) {
                    Log::warning('SUPABASE_TEMP_DELETE_FAIL_CAMPANHA_MIDIA', [
                        'campanha_id' => $campanha,
                        'temp_path' => $tempPath,
                        'status' => $delResp->status(),
                        'body' => $delResp->body(),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('SUPABASE_TEMP_DELETE_EXCEPTION_CAMPANHA_MIDIA', [
                    'campanha_id' => $campanha,
                    'temp_path' => $tempPath,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $row,
                'url' => $finalUrl,
                'dest_path' => $destPath,
            ]);
        } catch (QueryException $e) {
            Log::error('COMMIT_CAMPANHA_MIDIA_DB_FAIL', [
                'campanha_id' => $campanha,
                'temp_path' => $tempPath,
                'dest_path' => $destPath,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        } catch (\Throwable $e) {
            Log::error('COMMIT_CAMPANHA_MIDIA_FAIL', [
                'campanha_id' => $campanha,
                'temp_path' => $tempPath,
                'dest_path' => $destPath,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ Regras de transição (core do passo A)
     */
    private function canTransition(string $from, string $to): bool
    {
        $from = $from ?: 'rascunho';

        $map = [
            // OBS: self-transition é irrelevante porque validamos só quando muda.
            'rascunho' => ['rascunho', 'em_revisao', 'arquivado'],
            'em_revisao' => ['em_revisao', 'aprovado', 'reprovado', 'rascunho', 'arquivado'], // ✅ agora permite arquivar
            'reprovado' => ['reprovado', 'rascunho', 'em_revisao', 'arquivado'],
            'aprovado' => ['aprovado', 'publicado', 'em_revisao', 'arquivado'],
            'publicado' => ['publicado', 'arquivado'],
            'arquivado' => ['arquivado'], // travado
        ];

        $allowed = $map[$from] ?? [$from];
        return in_array($to, $allowed, true);
    }

    private function allowedNextStatuses(string $from): array
    {
        $from = $from ?: 'rascunho';

        $map = [
            'rascunho' => ['em_revisao', 'arquivado'],
            'em_revisao' => ['aprovado', 'reprovado', 'rascunho', 'arquivado'], // ✅ agora mostra arquivado
            'reprovado' => ['rascunho', 'em_revisao', 'arquivado'],
            'aprovado' => ['publicado', 'em_revisao', 'arquivado'],
            'publicado' => ['arquivado'],
            'arquivado' => [],
        ];

        return $map[$from] ?? [];
    }

    /**
     * ✅ (B) Auto-concluir ticket ao publicar
     * - só roda se tabelas existirem
     * - só fecha ticket "aberto" (conforme lista atual do sistema)
     * - grava ticket_logs
     * - seta campanha_midia_id se estiver null
     */
    private function autoConcludeTicketOnPublish(int $campanhaId, int $midiaId, ?int $actorId): void
    {
        try {
            if (!Schema::hasTable('tickets')) return;
            if (!Schema::hasColumn('tickets', 'campanha_id')) return;

            // Busca ticket "aberto" mais relevante (mesma priorização que já usamos no log)
            $ticket = DB::table('tickets')
                ->where('campanha_id', $campanhaId)
                ->orderByRaw("CASE WHEN status IN ('aberto','assigned','em_andamento','aguardando_cliente','aguardando_interno') THEN 0 ELSE 1 END ASC")
                ->orderByDesc('created_at')
                ->first(['id', 'status', 'campanha_midia_id']);

            if (!$ticket) return;

            $openStatuses = ['aberto','assigned','em_andamento','aguardando_cliente','aguardando_interno'];

            // Só conclui se estiver realmente "aberto"
            if (!in_array((string) $ticket->status, $openStatuses, true)) {
                return;
            }

            $payload = [
                'status' => 'concluido',
                'closed_at' => now(),
                'updated_at' => now(),
            ];

            if (Schema::hasColumn('tickets', 'resolved_at')) {
                $payload['resolved_at'] = now();
            }

            if (Schema::hasColumn('tickets', 'campanha_midia_id')) {
                $payload['campanha_midia_id'] = $ticket->campanha_midia_id ? $ticket->campanha_midia_id : $midiaId;
            }

            DB::table('tickets')->where('id', (int) $ticket->id)->update($payload);

            if (Schema::hasTable('ticket_logs')) {
                DB::table('ticket_logs')->insert([
                    'ticket_id' => (int) $ticket->id,
                    'user_id' => $actorId,
                    'action' => 'auto_conclude_on_publish',
                    'message' => "Mídia #{$midiaId} publicada | ticket concluído automaticamente.",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('CAMPANHA_MIDIA_AUTO_CLOSE_TICKET_FAIL', [
                'campanha_id' => $campanhaId,
                'midia_id' => $midiaId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function normalizeMetaJson($m)
    {
        if (!$m) return $m;
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

        if (property_exists($m, 'desktop_url') && !empty($m->desktop_url) && str_starts_with($m->desktop_url, '/storage/')) {
            $m->desktop_url = rtrim(config('app.url'), '/') . $m->desktop_url;
        }
        
        if (property_exists($m, 'mobile_url') && !empty($m->mobile_url) && str_starts_with($m->mobile_url, '/storage/')) {
            $m->mobile_url = rtrim(config('app.url'), '/') . $m->mobile_url;
        }

        return $m;
    }

    private function jsonbRaw($value)
    {
        if ($value === null) return null;

        $json = json_encode($value, JSON_UNESCAPED_UNICODE);
        if ($json === false) return null;

        return $json;
    }

    private function buildFieldChanges(array $before, $afterObj): array
    {
        $after = is_object($afterObj) ? (array) $afterObj : (array) $afterObj;

        $keys = ['status', 'approved_by', 'desktop_url', 'mobile_url', 'meta_json', 'updated_at'];
        $changes = [];

        foreach ($keys as $k) {
            $from = $before[$k] ?? null;
            $to = $after[$k] ?? null;

            if ($k === 'meta_json') {
                if (is_string($from)) {
                    $d = json_decode($from, true);
                    $from = (json_last_error() === JSON_ERROR_NONE) ? $d : $from;
                }
            }

            if ($from !== $to) {
                $changes[$k] = ['from' => $from, 'to' => $to];
            }
        }

        return $changes;
    }

    private function logTicketForMidiaChange(
        int $campanhaId,
        int $midiaId,
        ?int $actorId,
        ?string $status = null,
        ?string $comment = null
    ): void {
        try {
            if (!Schema::hasTable('tickets')) return;
            if (!Schema::hasColumn('tickets', 'campanha_id')) return;
            if (!Schema::hasTable('ticket_logs')) return;

            $ticket = DB::table('tickets')
                ->where('campanha_id', $campanhaId)
                ->orderByRaw("CASE WHEN status IN ('aberto','assigned','em_andamento','aguardando_cliente','aguardando_interno') THEN 0 ELSE 1 END ASC")
                ->orderByDesc('created_at')
                ->first(['id', 'status', 'campanha_midia_id']);

            if (!$ticket) return;

            if (Schema::hasColumn('tickets', 'campanha_midia_id')) {
                if (empty($ticket->campanha_midia_id)) {
                    DB::table('tickets')->where('id', $ticket->id)->update([
                        'campanha_midia_id' => $midiaId,
                        'updated_at' => now(),
                    ]);
                }
            }

            $parts = [];
            $parts[] = "Mídia #{$midiaId} atualizada";
            if ($status) $parts[] = "status={$status}";
            if ($comment) $parts[] = "obs=" . mb_substr($comment, 0, 400);

            DB::table('ticket_logs')->insert([
                'ticket_id' => (int) $ticket->id,
                'user_id' => $actorId,
                'action' => 'campanha_midia_updated',
                'message' => implode(' | ', $parts),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('CAMPANHA_MIDIA_TICKET_LOG_FAIL', [
                'campanha_id' => $campanhaId,
                'midia_id' => $midiaId,
                'error' => $e->getMessage(),
            ]);
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
            if (!$actorId) return;

            if (!Schema::hasTable('audit_logs')) return;

            $userExists = Schema::hasTable('users')
                ? DB::table('users')->where('id', (int) $actorId)->exists()
                : false;

            if (!$userExists) return;

            $req = request();


	   $metadata = array_merge([
    'ip' => $req?->ip(),
    'user_agent' => $req?->userAgent(),
    'path' => $req?->path(),
    'method' => $req?->method(),
], $metadata);


            DB::table('audit_logs')->insert([
                'actor_user_id' => (int) $actorId,
                'action' => (string) $action,
                'entity_type' => (string) $entityType,
                'entity_id' => (int) $entityId,
                'cliente_id' => $clienteId,
                'lead_id' => $leadId,
                'field_changes' => $fieldChanges ? $this->jsonbRaw($fieldChanges) : null,
                'metadata' => $metadata ? $this->jsonbRaw($metadata) : null,
                'created_at' => now(),
                'updated_at' => now(),
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


/**
 * ✅ C7) Ativar mídia por (tipo + slot) sem migration
 * POST /v1/campanhas/{campanha}/midias/{midia}/ativar
 *
 * Body: { "slot": "desktop"|"mobile", "comment": "..." }
 *
 * Regras:
 * - mídia deve estar "publicado"
 * - slot deve existir (desktop_url/mobile_url não vazio)
 * - garante unicidade: desativa a flag nas outras publicadas do mesmo tipo+slot
 */
public function ativarMidia(Request $request, int $campanha, int $midia)
{
    if (!Schema::hasTable('campanha_midias')) {
        abort(501, 'Tabela campanha_midias não existe neste ambiente.');
    }

    $data = $request->validate([
        'slot' => 'required|string|in:desktop,mobile',
        'comment' => 'nullable|string|max:1000',
    ]);

    $row = DB::table('campanha_midias')
        ->where('id', $midia)
        ->where('campanha_id', $campanha)
        ->first();

    if (!$row) {
        return response()->json(['success' => false, 'message' => 'Mídia não encontrada para esta campanha.'], 404);
    }

    $status = (string) ($row->status ?? '');
    if ($status !== 'publicado') {
        return response()->json([
            'success' => false,
            'message' => 'Só é possível ativar uma mídia com status=publicado.',
            'data' => ['status_atual' => $status],
        ], 422);
    }

    $slot = $data['slot'];
    $flagKey = $slot === 'desktop' ? 'ativa_desktop' : 'ativa_mobile';

    // valida slot tem url
    if ($slot === 'desktop' && empty($row->desktop_url)) {
        return response()->json(['success' => false, 'message' => 'Esta mídia não possui desktop_url.'], 422);
    }
    if ($slot === 'mobile' && empty($row->mobile_url)) {
        return response()->json(['success' => false, 'message' => 'Esta mídia não possui mobile_url.'], 422);
    }

    $actorId = auth()->id();
    $now = now();

    try {

	DB::transaction(function () use ($campanha, $midia, $row, $flagKey, $now) {

    $tipo = (string) $row->tipo;

    // 1) Remove flag das outras mídias publicadas do mesmo tipo
    DB::table('campanha_midias')
        ->where('campanha_id', $campanha)
        ->where('tipo', $tipo)
        ->where('status', 'publicado')
        ->where('id', '!=', $midia)
        ->update([
            'meta_json' => DB::raw("COALESCE(meta_json, '{}'::jsonb) - '" . $flagKey . "'"),
            'updated_at' => $now,
        ]);

    // 2) Seta flag true no alvo
    DB::table('campanha_midias')
        ->where('campanha_id', $campanha)
        ->where('id', $midia)
        ->update([
            'meta_json' => DB::raw(
                "jsonb_set(COALESCE(meta_json, '{}'::jsonb), '{" . $flagKey . "}', 'true'::jsonb, true)"
            ),
            'updated_at' => $now,
        ]);
});



        $afterRow = DB::table('campanha_midias')
            ->where('id', $midia)
            ->where('campanha_id', $campanha)
            ->first();

        $afterRow = $this->normalizeMetaJson($afterRow);

        // log no ticket (safe) — sem quebrar nada, usando o logger atual
        $this->logTicketForMidiaChange(
            campanhaId: $campanha,
            midiaId: $midia,
            actorId: $actorId ? (int) $actorId : null,
            status: null,
            comment: ($data['comment'] ?? "Mídia definida como ativa ({$slot})")
        );

        // audit (safe)
        $this->audit(
            action: 'activate',
            entityType: 'campanha_midia',
            entityId: (int) $midia,
            fieldChanges: [
                $flagKey => ['from' => null, 'to' => true],
            ],
            clienteId: null,
            leadId: null,
            metadata: [
                'campanha_id' => $campanha,
                'slot' => $slot,
                'source' => 'ativar-midia',
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $afterRow,
        ]);

    } catch (\Throwable $e) {
        Log::error('CAMPANHA_MIDIA_ACTIVATE_FAIL', [
            'campanha_id' => $campanha,
            'midia_id' => $midia,
            'slot' => $slot,
            'error' => $e->getMessage(),
        ]);

        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], 500);
    }
}



}
