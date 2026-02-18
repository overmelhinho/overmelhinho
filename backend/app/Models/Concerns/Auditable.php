<?php

namespace App\Models\Concerns;

use App\Services\AuditLogger;

trait Auditable
{
    /**
     * Snapshot do estado "antes" do update.
     * IMPORTANTE: propriedade real para NÃO virar coluna no banco.
     */
    protected array $auditBefore = [];

    protected static function bootAuditable(): void
    {
        static::created(function ($model) {
            app(AuditLogger::class)->logModelCreate($model);
        });

        static::updating(function ($model) {
            // guarda antes do update (não vai pro banco)
            $model->auditBefore = $model->getOriginal();
        });

        static::updated(function ($model) {
            $before = $model->auditBefore ?: [];
            $model->auditBefore = [];

            // Preferência: se existir um logger que recebe before, use ele.
            // Se você ainda não criou logModelUpdated(), use logModelUpdate (mas veja nota abaixo).
            if (method_exists(app(AuditLogger::class), 'logModelUpdated')) {
                app(AuditLogger::class)->logModelUpdated($model, $before);
                return;
            }

            // fallback (se seu AuditLogger atual só tem logModelUpdate)
            app(AuditLogger::class)->logModelUpdate(
                $model,
                $model->getAuditInclude()
            );
        });

        static::deleted(function ($model) {
            app(AuditLogger::class)->logModelDelete($model);
        });
    }

    public function getAuditInclude(): ?array
    {
        return property_exists($this, 'auditInclude') ? $this->auditInclude : null;
    }

    public function getAuditEntityType(): ?string
    {
        return property_exists($this, 'auditEntityType') ? $this->auditEntityType : null;
    }
}
