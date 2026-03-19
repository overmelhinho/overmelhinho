<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ClientReport extends Model
{
    protected $table = 'client_reports';

    protected $fillable = [
        'cliente_id',
        'generated_by',
        'token',
        'period_label',
        'start_date',
        'end_date',
        'data',
        'notes',
        'status',
        'viewed_at',
    ];

    protected $casts = [
        'data'      => 'array',
        'viewed_at' => 'datetime',
        'start_date'=> 'date',
        'end_date'  => 'date',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->token)) {
                $model->token = Str::random(48);
            }
        });
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
