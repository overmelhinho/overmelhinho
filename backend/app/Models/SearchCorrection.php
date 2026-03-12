<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchCorrection extends Model
{
    protected $fillable = [
        'typo',
        'correction',
        'hit_count',
        'is_verified'
    ];
}
