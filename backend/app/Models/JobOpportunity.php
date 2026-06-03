<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobOpportunity extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'title',
        'description',
        'salary_range',
        'hiring_type',
        'work_model',
        'city',
        'vacancies',
        'area',
        'role',
        'education_level',
        'experience_required',
        'contact_email',
        'contact_whatsapp',
        'status',
        'is_active',
        'views_count',
        'published_at',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => \App\Casts\PostgresBoolean::class,
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // Relacionamento com a empresa (cliente)
    public function client()
    {
        return $this->belongsTo(Cliente::class , 'client_id');
    }

    // Relacionamento com candidatos
    public function candidates()
    {
        return $this->hasMany(Candidate::class , 'job_opportunity_id');
    }

    // Scope: apenas vagas ativas e publicadas (para o site público)
    public function scopePublished($query)
    {
        return $query->where('is_active', \Illuminate\Support\Facades\DB::raw('true'))
            ->where('status', 'Published')
            ->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }
}
