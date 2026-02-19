<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\JobOpportunity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CandidateController extends Controller
{
    /**
     * GET /api/v1/clients/{clientId}/candidates
     * Lista todos os candidatos das vagas de um cliente
     */
    public function indexByClient(Request $request, $clientId)
    {
        $jobIds = JobOpportunity::where('client_id', $clientId)->pluck('id');

        $query = Candidate::whereIn('job_opportunity_id', $jobIds)
            ->with('jobOpportunity:id,title');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->job_id) {
            $query->where('job_opportunity_id', $request->job_id);
        }

        $candidates = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($candidates);
    }

    /**
     * GET /api/v1/jobs/{jobId}/candidates
     * Lista candidatos de uma vaga específica
     */
    public function indexByJob($jobId)
    {
        $job = JobOpportunity::findOrFail($jobId);

        $candidates = Candidate::where('job_opportunity_id', $jobId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'job' => $job->only(['id', 'title']),
            'candidates' => $candidates,
        ]);
    }

    /**
     * PATCH /api/v1/candidates/{id}/status
     * Atualizar status do candidato (Kanban)
     */
    public function updateStatus(Request $request, $id)
    {
        $candidate = Candidate::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:New,Reviewing,Interview,Rejected,Hired',
        ]);

        $candidate->update(['status' => $validated['status']]);

        return response()->json($candidate);
    }

    /**
     * GET /api/v1/candidates/{id}/resume
     * Download/visualização do currículo
     */
    public function downloadResume($id)
    {
        $candidate = Candidate::findOrFail($id);

        if (!$candidate->resume_path || !Storage::disk('public')->exists($candidate->resume_path)) {
            return response()->json(['message' => 'Currículo não encontrado.'], 404);
        }

        return response()->json([
            'url' => asset('storage/' . $candidate->resume_path),
        ]);
    }

    /**
     * DELETE /api/v1/candidates/{id}
     * Remover candidato
     */
    public function destroy($id)
    {
        $candidate = Candidate::findOrFail($id);

        // Remover arquivo do currículo
        if ($candidate->resume_path) {
            Storage::disk('public')->delete($candidate->resume_path);
        }

        $candidate->delete();

        return response()->json(['message' => 'Candidato removido com sucesso.']);
    }
}
