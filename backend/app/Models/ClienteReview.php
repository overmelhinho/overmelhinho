<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClienteReview extends Model
{
    protected $fillable = [
        'cliente_id',
        'author_name',
        'author_photo_url',
        'rating',
        'text',
        'relative_time_description',
        'google_review_id',
        'is_visible'
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'relative_time_description' => 'datetime'
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
}
