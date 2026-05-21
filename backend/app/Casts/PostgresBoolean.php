<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class PostgresBoolean implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
    }
}
