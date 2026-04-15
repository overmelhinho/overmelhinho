<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CampanhaWizardService
{
    private const FIN_AGUARDANDO = 'aguardando_pagamento';
    private const FIN_PAGO = 'pago';
    private const FIN_CORTESIA = 'cortesia';

    private const CAMP_ATIVA = 'ativa';
    private const CAMP_PENDENTE = 'pendente';

    /* =========================================================
     * HELPERS
     * ========================================================= */

    private function normalizeFinanceStatus(?string $s): string
    {
        $v = trim((string) $s);
        if ($v === '') return self::FIN_AGUARDANDO;

        $lower = mb_strtolower($v);

        if (in_array($lower, [self::FIN_AGUARDANDO, self::FIN_PAGO, self::FIN_CORTESIA], true)) {
            return $lower;
        }

        $upper = mb_strtoupper($v);
        if ($upper === 'AGUARDANDO_PAGAMENTO') return self::FIN_AGUARDANDO;
        if ($upper === 'PAGO') return self::FIN_PAGO;
        if ($upper === 'CORTESIA') return self::FIN_CORTESIA;

        return self::FIN_AGUARDANDO;
    }

    private function deriveCampaignStatusFromFinance(string $finStatus): string
    {
        return in_array($finStatus, [self::FIN_PAGO, self::FIN_CORTESIA, self::FIN_AGUARDANDO], true)
            ? self::CAMP_ATIVA
            : self::CAMP_PENDENTE;
    }

    private function normalizeKeyword(string $original): string
    {
        $v = trim($original);
        $v = mb_strtolower($v);

        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $v);
        if (is_string($ascii) && $ascii !== '') {
            $v = $ascii;
        }

        $v = preg_replace('/\s+/', ' ', $v) ?? $v;
        return trim($v);
    }

    /* =========================================================
     * CREATE (já existente)
     * ========================================================= */

    public function create(array $data): array
    {
        $id = $this->createFromWizard(
            payload: $data,
            actorUserId: (int) ($data['actor_user_id'] ?? 0)
        );

        return ['id' => $id];
    }

    private function createFromWizard(array $payload, int $actorUserId): int
    {
        return DB::transaction(function () use ($payload, $actorUserId) {
            $now = now();

            if (empty($payload['cliente_id'])) abort(422, 'cliente_id é obrigatório.');
            if (empty($payload['nome'])) abort(422, 'nome é obrigatório.');
            if (empty($payload['tipo'])) abort(422, 'tipo é obrigatório.');

            $clienteId = (int) $payload['cliente_id'];

            // 1) FINANCEIRO STATUS
            $fin = is_array($payload['financeiro'] ?? null) ? $payload['financeiro'] : [];
            $finStatus = $this->normalizeFinanceStatus($fin['status'] ?? null);
            $campanhaStatus = $this->deriveCampaignStatusFromFinance($finStatus);

            // 2) PLACEMENTS (JSON)
            $placementsJson = null;
            if (!empty($payload['placements']) && is_array($payload['placements'])) {
                $placementsJson = json_encode(array_values($payload['placements']), JSON_UNESCAPED_UNICODE);
            }

            // 3) CREATE CAMPANHA
            $insert = [
                'cliente_id'  => $clienteId,
                'nome'        => (string) $payload['nome'],
                'tipo'        => (string) $payload['tipo'],
                'origem'      => $payload['origem'] ?? null,
                'status'      => $campanhaStatus,
                'data_inicio' => $payload['data_inicio'],
                'data_fim'    => $payload['data_fim'],
                'url'         => $payload['url'] ?? null,
                'is_institucional' => (bool) ($payload['is_institucional'] ?? false),
                'created_at'  => $now,
                'updated_at'  => $now,
            ];

            if (Schema::hasColumn('campanhas', 'placements_json')) {
                $insert['placements_json'] = $placementsJson;
            } elseif (Schema::hasColumn('campanhas', 'placements')) {
                $insert['placements'] = $placementsJson;
            }

            if (Schema::hasColumn('campanhas', 'created_by')) {
                $insert['created_by'] = $actorUserId > 0 ? $actorUserId : null;
            }

            $campanhaId = DB::table('campanhas')->insertGetId($insert);

            // 4) CIDADES
            if (!empty($payload['cidades_ids']) && Schema::hasTable('campanha_cidades')) {
                $cidadesRows = collect($payload['cidades_ids'])
                    ->map(fn($id) => (int)$id)
                    ->filter(fn($id) => $id > 0)
                    ->unique()
                    ->map(fn($cidadeId) => [
                        'campanha_id' => $campanhaId,
                        'cidade_id'   => $cidadeId,
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ])->all();

                if (!empty($cidadesRows)) {
                    DB::table('campanha_cidades')->insert($cidadesRows);
                }
            }

            // 5) KEYWORDS
            if (!empty($payload['keywords']) && Schema::hasTable('campanha_keywords')) {
                $keywordsRows = collect($payload['keywords'])
                    ->filter(fn($k) => is_string($k) && trim($k) !== '')
                    ->map(function ($k) {
                        $original = trim((string)$k);
                        $normalizada = $this->normalizeKeyword($original);
                        return [$original, $normalizada];
                    })
                    ->filter(fn($pair) => $pair[1] !== '')
                    ->unique(fn($pair) => $pair[1])
                    ->map(fn($pair) => [
                        'campanha_id'         => $campanhaId,
                        'keyword_original'    => $pair[0],
                        'keyword_normalizada' => $pair[1],
                        'created_at'          => $now,
                        'updated_at'          => $now,
                    ])->all();

                if (!empty($keywordsRows)) {
                    DB::table('campanha_keywords')->insert($keywordsRows);
                }
            }

            // 6) FINANCEIRO
            if (Schema::hasTable('campanha_financeiro')) {
                $finData = [
                    'campanha_id' => $campanhaId,
                    'status'      => $finStatus,
                    'forma'       => $fin['forma'] ?? null,
                    'valor'       => isset($fin['valor']) ? (float)$fin['valor'] : 0,
                    'vencimento'  => $fin['vencimento'] ?? null,
                    'pago_em'     => $fin['pago_em'] ?? null,
                    'observacao'  => $fin['observacao'] ?? null,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ];
                if (Schema::hasColumn('campanha_financeiro', 'created_by')) {
                    $finData['created_by'] = $actorUserId > 0 ? $actorUserId : null;
                }
                DB::table('campanha_financeiro')->insert($finData);
            }

            return $campanhaId;
        });
    }

    /* =========================================================
     * UPDATE (NOVO)
     * ========================================================= */

    public function updateFromWizard(int $campanhaId, array $payload, int $actorUserId): void
    {
        DB::transaction(function () use ($campanhaId, $payload, $actorUserId) {

            $now = now();

            if (!DB::table('campanhas')->where('id', $campanhaId)->exists()) {
                abort(404, 'Campanha não encontrada.');
            }

            if (empty($payload['cliente_id'])) abort(422, 'cliente_id é obrigatório.');
            if (empty($payload['nome'])) abort(422, 'nome é obrigatório.');
            if (empty($payload['tipo'])) abort(422, 'tipo é obrigatório.');

            $clienteId = (int) $payload['cliente_id'];

            /* =========================
             * 1) FINANCEIRO
             * ========================= */

            $fin = is_array($payload['financeiro'] ?? null) ? $payload['financeiro'] : [];
            $finStatus = $this->normalizeFinanceStatus($fin['status'] ?? null);
            $campanhaStatus = $this->deriveCampaignStatusFromFinance($finStatus);

            /* =========================
             * 2) UPDATE CAMPANHA
             * ========================= */

            $update = [
                'cliente_id'  => $clienteId,
                'nome'        => (string) $payload['nome'],
                'tipo'        => (string) $payload['tipo'],
                'origem'      => $payload['origem'] ?? null,
                'status'      => $campanhaStatus,
                'data_inicio' => $payload['data_inicio'],
                'data_fim'    => $payload['data_fim'],
                'url'         => $payload['url'] ?? null,
                'is_institucional' => (bool) ($payload['is_institucional'] ?? false),
                'updated_at'  => $now,
            ];

            if (Schema::hasColumn('campanhas', 'updated_by')) {
                $update['updated_by'] = $actorUserId > 0 ? $actorUserId : null;
            }

            DB::table('campanhas')
                ->where('id', $campanhaId)
                ->update($update);

            /* =========================
             * 3) CIDADES (sync)
             * ========================= */

            if (Schema::hasTable('campanha_cidades')) {

                DB::table('campanha_cidades')
                    ->where('campanha_id', $campanhaId)
                    ->delete();

                if (!empty($payload['cidades_ids'])) {
                    $ids = collect($payload['cidades_ids'])
                        ->map(fn($v) => (int)$v)
                        ->filter(fn($v) => $v > 0)
                        ->unique()
                        ->values();

                    if ($ids->isNotEmpty()) {
                        $rows = $ids->map(fn($cidadeId) => [
                            'campanha_id' => $campanhaId,
                            'cidade_id'   => $cidadeId,
                            'created_at'  => $now,
                            'updated_at'  => $now,
                        ])->all();

                        DB::table('campanha_cidades')->insert($rows);
                    }
                }
            }

            /* =========================
             * 4) KEYWORDS (sync)
             * ========================= */

            if (Schema::hasTable('campanha_keywords')) {

                DB::table('campanha_keywords')
                    ->where('campanha_id', $campanhaId)
                    ->delete();

                if (!empty($payload['keywords'])) {
                    $rows = collect($payload['keywords'])
                        ->filter(fn($k) => is_string($k) && trim($k) !== '')
                        ->map(function ($k) {
                            $original = trim((string)$k);
                            $normalizada = $this->normalizeKeyword($original);
                            return [$original, $normalizada];
                        })
                        ->filter(fn($pair) => $pair[1] !== '')
                        ->unique(fn($pair) => $pair[1])
                        ->values()
                        ->map(fn($pair) => [
                            'campanha_id'         => $campanhaId,
                            'keyword_original'    => $pair[0],
                            'keyword_normalizada' => $pair[1],
                            'created_at'          => $now,
                            'updated_at'          => $now,
                        ])
                        ->all();

                    if (!empty($rows)) {
                        DB::table('campanha_keywords')->insert($rows);
                    }
                }
            }

            /* =========================
             * 5) FINANCEIRO (upsert)
             * ========================= */

            if (Schema::hasTable('campanha_financeiro')) {

                $exists = DB::table('campanha_financeiro')
                    ->where('campanha_id', $campanhaId)
                    ->exists();

                $data = [
                    'status'     => $finStatus,
                    'forma'      => $fin['forma'] ?? null,
                    'valor'      => isset($fin['valor']) ? (float)$fin['valor'] : 0,
                    'vencimento' => $fin['vencimento'] ?? null,
                    'pago_em'    => $fin['pago_em'] ?? null,
                    'observacao' => $fin['observacao'] ?? null,
                    'updated_at' => $now,
                ];

                if ($exists) {
                    DB::table('campanha_financeiro')
                        ->where('campanha_id', $campanhaId)
                        ->update($data);
                } else {
                    DB::table('campanha_financeiro')
                        ->insert(array_merge($data, [
                            'campanha_id' => $campanhaId,
                            'created_at'  => $now,
                        ]));
                }
            }
        });
    }
}
