<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SeoInsight;
use App\Services\ClientAiService;

class SeoInsightController extends Controller
{
    /**
     * Display a listing of pending SEO insights with filters, sorting, and pagination.
     */
    public function index(Request $request)
    {
        $query = SeoInsight::with('cliente:id,nome_fantasia,slug');

        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', 'pending');
        }

        if ($request->has('insight_type') && !empty($request->insight_type)) {
            $query->where('insight_type', $request->insight_type);
        }

        if ($request->has('cliente_id') && !empty($request->cliente_id)) {
            $query->where('cliente_id', $request->cliente_id);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('url', 'ilike', "%{$search}%")
                  ->orWhere('keyword', 'ilike', "%{$search}%")
                  ->orWhereHas('cliente', function($qc) use ($search) {
                      $qc->where('nome_fantasia', 'ilike', "%{$search}%");
                  });
            });
        }

        $sortBy = $request->input('sort_by', 'impressions');
        $sortOrder = $request->input('sort_order', 'desc');
        
        $allowedSorts = ['impressions', 'ctr', 'position', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        $perPage = $request->input('per_page', 20);
        $insights = $query->paginate($perPage);

        return response()->json($insights);
    }

    /**
     * Handle bulk actions for multiple insights.
     */
    public function bulkAction(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:seo_insights,id',
            'status' => 'required|in:applied,ignored'
        ]);

        SeoInsight::whereIn('id', $request->ids)
            ->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Insights atualizados com sucesso em lote.'
        ]);
    }

    /**
     * Update the status of an insight (e.g. applied, ignored).
     */
    public function updateAction(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:applied,ignored'
        ]);

        $insight = SeoInsight::findOrFail($id);
        
        $insight->status = $request->status;
        $insight->save();

        return response()->json([
            'message' => 'Insight atualizado com sucesso.',
            'insight' => $insight
        ]);
    }

    /**
     * Generate AI suggestions for a specific insight.
     */
    public function generateAi(Request $request, $id)
    {
        $insight = SeoInsight::findOrFail($id);
        
        if (!$insight->url) {
            return response()->json(['error' => 'URL is required to generate AI suggestions.'], 400);
        }

        $aiService = new ClientAiService();
        $suggestions = $aiService->generateSeoSuggestions($insight->keyword, $insight->url, $insight->insight_type);

        if (empty($suggestions)) {
            return response()->json(['error' => 'Falha ao gerar sugestões com IA. Tente novamente mais tarde.'], 500);
        }

        return response()->json([
            'insight' => $insight,
            'suggestions' => $suggestions
        ]);
    }
}
