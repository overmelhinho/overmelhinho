<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_opportunity_id',
        'name',
        'email',
        'phone',
        'linkedin_url',
        'resume_path',
        'status',
    ];

    // Relacionamento com a vaga
    public function jobOpportunity()
    {
        return $this->belongsTo(JobOpportunity::class , 'job_opportunity_id');
    }

    // Status possíveis
    const STATUSES = ['New', 'Reviewing', 'Interview', 'Rejected', 'Hired'];
}
