<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\JobOpportunity;
use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class JobOpportunityController extends Controller
{
    /**
     * GET /api/v1/jobs/public
     * Listagem pública de vagas ativas (sem autenticação)
     */
    public function indexPublic(Request $request)
    {
        $query = JobOpportunity::published()
            ->with('client:id,nome_fantasia')
            ->withCount('candidates');

        if ($request->city) {
            $query->where('city', 'like', '%' . $request->city . '%');
        }

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        if ($request->hiring_type) {
            $query->where('hiring_type', $request->hiring_type);
        }

        if ($request->work_model) {
            $query->where('work_model', $request->work_model);
        }

        $jobs = $query->orderBy('published_at', 'desc')->paginate(12);

        return response()->json($jobs);
    }

    /**
     * GET /api/v1/jobs/public/{id}
     * Detalhes públicos de uma vaga
     */
    public function showPublic($id)
    {
        $job = JobOpportunity::published()
            ->with('client:id,nome_fantasia')
            ->findOrFail($id);

        // Incrementar contador de visualizações
        $job->increment('views_count');

        return response()->json($job);
    }

    /**
     * GET /api/v1/jobs (Admin)
     * Listagem de vagas da empresa autenticada
     */
    public function index(Request $request)
    {
        $query = JobOpportunity::with('client:id,nome_fantasia')
            ->withCount('candidates');

        if ($request->client_id) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('city', 'like', '%' . $request->search . '%')
                  ->orWhereHas('client', function ($q2) use ($request) {
                      $q2->where('nome_fantasia', 'like', '%' . $request->search . '%')
                         ->orWhere('razao_social', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->city) {
            $query->where('city', 'like', '%' . $request->city . '%');
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $jobs = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($jobs);
    }

    /**
     * POST /api/v1/jobs (Admin)
     * Criar nova vaga
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clientes,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'salary_range' => 'nullable|string|max:100',
            'hiring_type' => 'nullable|string|max:50',
            'work_model' => 'nullable|in:Presencial,Híbrido,Remoto',
            'city' => 'nullable|string|max:150',
            'status' => 'nullable|in:Draft,Published,Closed,Paused',
            'expires_at' => 'nullable|date',
            'vacancies' => 'nullable|integer|min:1',
            'area' => 'nullable|string|max:100',
            'role' => 'nullable|string|max:100',
            'education_level' => 'nullable|string|max:100',
            'experience_required' => 'nullable|string',
            'contact_email' => 'nullable|email|max:255',
            'contact_whatsapp' => 'nullable|string|max:30',
        ]);

        // is_active = false por padrão (aguarda aprovação do Admin)
        $validated['is_active'] = false;

        if (isset($validated['status']) && $validated['status'] === 'Published') {
            $validated['published_at'] = now();
        }

        $job = JobOpportunity::create($validated);

        return response()->json($job, 201);
    }

    /**
     * GET /api/v1/jobs/{id} (Admin)
     */
    public function show($id)
    {
        $job = JobOpportunity::with(['client:id,nome_fantasia,razao_social', 'candidates'])
            ->withCount('candidates')
            ->findOrFail($id);

        return response()->json($job);
    }

    /**
     * PUT /api/v1/jobs/{id} (Admin)
     * Atualizar vaga (incluindo ativar/desativar)
     */
    public function update(Request $request, $id)
    {
        $job = JobOpportunity::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'salary_range' => 'nullable|string|max:100',
            'hiring_type' => 'nullable|string|max:50',
            'work_model' => 'nullable|in:Presencial,Híbrido,Remoto',
            'city' => 'nullable|string|max:150',
            'status' => 'nullable|in:Draft,Published,Closed,Paused',
            'is_active' => 'sometimes|boolean',
            'expires_at' => 'nullable|date',
            'vacancies' => 'nullable|integer|min:1',
            'area' => 'nullable|string|max:100',
            'role' => 'nullable|string|max:100',
            'education_level' => 'nullable|string|max:100',
            'experience_required' => 'nullable|string',
            'contact_email' => 'nullable|email|max:255',
            'contact_whatsapp' => 'nullable|string|max:30',
        ]);

        // Se estiver sendo publicada agora, registrar data
        if (isset($validated['status']) && $validated['status'] === 'Published' && !$job->published_at) {
            $validated['published_at'] = now();
        }

        $job->update($validated);

        return response()->json($job);
    }

    /**
     * DELETE /api/v1/jobs/{id} (Admin)
     */
    public function destroy($id)
    {
        $job = JobOpportunity::findOrFail($id);
        $job->delete();

        return response()->json(['message' => 'Vaga removida com sucesso.']);
    }

    /**
     * POST /api/v1/jobs/{id}/apply (Público)
     * Candidato envia currículo
     */
    public function apply(Request $request, $id)
    {
        $job = JobOpportunity::published()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'linkedin_url' => 'nullable|url|max:255',
            'resume' => 'required|file|mimes:pdf,doc,docx|max:5120', // 5MB
        ]);

        // Verificar se já se candidatou
        $alreadyApplied = Candidate::where('job_opportunity_id', $id)
            ->where('email', $validated['email'])
            ->exists();

        if ($alreadyApplied) {
            return response()->json(['message' => 'Você já se candidatou a esta vaga.'], 422);
        }

        // Upload do currículo
        $resumePath = $request->file('resume')->store('curriculos', 'public');

        try {
            $candidate = Candidate::create([
                'job_opportunity_id' => $id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'linkedin_url' => $validated['linkedin_url'] ?? null,
                'resume_path' => $resumePath,
                'status' => 'New',
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // Caso ocorra Race Condition (usuário clicar várias vezes seguidas no botão)
            if ($e->getCode() === '23505') { // Postgres Unique Violation
                return response()->json(['message' => 'Você já se candidatou a esta vaga.'], 422);
            }
            throw $e;
        }

        return response()->json([
            'message' => 'Candidatura enviada com sucesso!',
            'candidate' => $candidate,
        ], 201);
    }
}
