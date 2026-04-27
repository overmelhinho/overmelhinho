<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class AuditLogger
{
    /**
     * Log base (baixo nível).
     */
    public function log(
        string $action,
        string $entityType,
        int $entityId,
        array $fieldChanges = null,
        array $context = []
    ): AuditLog {
        $actorId = $context['actor_id'] ?? auth()->id() ?? null;
        
        // Se não tiver usuário autenticado nem ator no contexto, permitimos null (ações anônimas/sistema)

        // ✅ Metadata automática do request (quando existir e não vier via context)
        $metadata = $context['metadata'] ?? null;

        try {
            $req = request();
            if ($metadata === null && $req && method_exists($req, 'ip')) {
                $metadata = [
                    'ip' => $req->ip(),
                    'user_agent' => $req->userAgent(),
                    'path' => $req->path(),
                    'method' => $req->method(),
                ];
            }
        } catch (\Throwable $e) {
            // Se não houver request (CLI/jobs), mantém null
        }

        $clienteId = $context['cliente_id'] ?? null;
        $leadId    = $context['lead_id'] ?? null;

        // ✅ Regra: logs do "cliente" devem sempre ter cliente_id preenchido
        if ($clienteId === null && $entityType === 'cliente') {
            $clienteId = $entityId;
        }


	// ✅ Regra: logs do "lead" devem sempre ter lead_id preenchido
	if ($leadId === null && $entityType === 'lead') {
	    $leadId = $entityId;
	}



        $payload = [
            'actor_user_id' => $actorId ? (int) $actorId : null,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'cliente_id' => $clienteId,
            'lead_id' => $leadId,
            'field_changes' => $fieldChanges,
            'metadata' => $metadata,
        ];

        return AuditLog::create($payload);
    }

    /**
     * Compat: update calculando diff a partir do model (ideal para chamar em "updating").
     * OBS: após "updated", getDirty tende a vir vazio. Para diff perfeito pós-save,
     * prefira logModelUpdated($model, $before).
     */
    public function logModelUpdate(Model $model, array $onlyFields = null, array $context = []): ?AuditLog
    {
        $dirty = $model->getDirty();
        if (empty($dirty)) return null;

        if ($onlyFields) {
            $dirty = Arr::only($dirty, $onlyFields);
            if (empty($dirty)) return null;
        }

        $ignored = ['updated_at', 'created_at'];

        $changes = [];
        foreach ($dirty as $field => $newValue) {
            if (in_array($field, $ignored, true)) continue;

            $oldValue = $model->getOriginal($field);

            $oldValue = $this->normalizeValue($oldValue);
            $newValue = $this->normalizeValue($newValue);

            if ($oldValue === $newValue) continue;

            $changes[$field] = [
                'from' => $oldValue,
                'to' => $newValue,
            ];
        }

        if (empty($changes)) return null;

        return $this->log(
            'update',
            $this->resolveEntityTypeFromModel($model),
            (int) $model->getKey(),
            $changes,
            $this->resolveContext($model, $context)
        );
    }

    /**
     * ✅ Update com snapshot "before" (perfeito para usar no trait/observer global).
     */
    public function logModelUpdated(Model $model, array $before, array $context = []): ?AuditLog
    {
        // no "updated", o melhor é usar changes (o que efetivamente foi alterado no save)
        $afterChanges = $model->getChanges();
        if (empty($afterChanges)) return null;

        $include = method_exists($model, 'getAuditInclude')
            ? $model->getAuditInclude()
            : null;

        $ignored = ['updated_at', 'created_at'];

        $changes = [];

        foreach ($afterChanges as $field => $newValue) {
            if (in_array($field, $ignored, true)) continue;

            if (is_array($include) && !in_array($field, $include, true)) {
                continue;
            }

            $oldValue = $before[$field] ?? null;

            $oldValue = $this->normalizeValue($oldValue);
            $newValue = $this->normalizeValue($newValue);

            if ($oldValue === $newValue) continue;

            $changes[$field] = [
                'from' => $oldValue,
                'to' => $newValue,
            ];
        }

        if (empty($changes)) return null;

        return $this->log(
            'update',
            $this->resolveEntityTypeFromModel($model),
            (int) $model->getKey(),
            $changes,
            $this->resolveContext($model, $context)
        );
    }

    public function logModelCreate(Model $model, array $context = []): AuditLog
    {
        return $this->log(
            'create',
            $this->resolveEntityTypeFromModel($model),
            (int) $model->getKey(),
            null,
            $this->resolveContext($model, $context)
        );
    }

    public function logModelDelete(Model $model, array $context = []): AuditLog
    {
        return $this->log(
            'delete',
            $this->resolveEntityTypeFromModel($model),
            (int) $model->getKey(),
            null,
            $this->resolveContext($model, $context)
        );
    }

    /**
     * Helper para montar metadata manualmente a partir do Request (quando quiser usar no controller).
     */
    public function withRequestMetadata(Request $request, array $metadata = []): array
    {
        return array_merge($metadata, [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'path' => $request->path(),
            'method' => $request->method(),
        ]);
    }

    /**
     * Resolve entity_type respeitando customização do model (auditEntityType).
     */
    private function resolveEntityTypeFromModel(Model $model): string
    {
        if (method_exists($model, 'getAuditEntityType')) {
            $custom = $model->getAuditEntityType();
            if (is_string($custom) && $custom !== '') {
                return $custom;
            }
        }

        return $this->resolveEntityType($model);
    }

    /**
     * Padrão: snake_case do nome da classe
     * Ex: App\Models\Cliente => "cliente"
     */
    private function resolveEntityType(Model $model): string
    {
        $base = class_basename($model);
        return Str::snake($base);
    }

    /**
     * Amarra automaticamente cliente_id/lead_id se o model tiver essas colunas.
     */
    private function resolveContext(Model $model, array $context): array
    {
        $clienteId = $context['cliente_id'] ?? ($model->getAttribute('cliente_id') ?? null);
        $leadId    = $context['lead_id'] ?? ($model->getAttribute('lead_id') ?? null);

        // ✅ Se o próprio entity é cliente, força cliente_id (pra timeline funcionar)
        $entityType = $this->resolveEntityTypeFromModel($model);
        if ($clienteId === null && $entityType === 'cliente') {
            $clienteId = (int) $model->getKey();
        }

        return array_merge($context, [
            'cliente_id' => $clienteId,
            'lead_id' => $leadId,
        ]);
    }

    /**
     * Normaliza valores para comparação/serialização no JSON.
     */
    private function normalizeValue($value)
    {
        if ($value instanceof \Carbon\Carbon) {
            return $value->toIso8601String();
        }

        // Se vier DateTime
        if ($value instanceof \DateTimeInterface) {
            return $value->format(DATE_ATOM);
        }

        return $value;
    }
}
