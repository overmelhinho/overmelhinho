<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;
use App\Services\AuditLogger;

class AuditObserver
{
    public function created(Model $model): void
    {
        if (!method_exists($model, 'getAuditEntityType')) return;

        app(AuditLogger::class)->logModelCreate($model);
    }

    public function updated(Model $model): void
    {
        if (!method_exists($model, 'getAuditEntityType')) return;

        app(AuditLogger::class)->logModelUpdate(
            $model,
            $model->getAuditInclude()
        );
    }

    public function deleted(Model $model): void
    {
        if (!method_exists($model, 'getAuditEntityType')) return;

        app(AuditLogger::class)->logModelDelete($model);
    }
}
