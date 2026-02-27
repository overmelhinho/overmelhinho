<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchLog extends Model
{
    protected $fillable = [
        'term', 'city', 'results_count', 'ip_address', 'user_agent', 'session_id'
    ];
}
