<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SeoInsight;
use App\Models\Cliente;
use App\Services\ClientAiService;
use App\Jobs\ProcessClienteSeoJob;

class SeoInsightController extends Controller
{
    /**
     * Display a listing of pending SEO insights with filters, sorting, and pagination.
     */
    public function index(Request $request)
    {
        $query = SeoInsight::with('cliente:id,nome_fantasia,slug');

        if ($request->has('status') && !empty($request->status)) {
            if ($request->status !== 'all') {
                $query->where('status', $request->status);
            }
            // se for 'all', não aplica filtro de status
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
        $suggestion = $aiService->generateSeoSuggestions($insight->keyword, $insight->url, $insight->insight_type);

        if (empty($suggestion) || !isset($suggestion['title'])) {
            return response()->json(['error' => 'Falha ao gerar otimização com IA. Tente novamente mais tarde.'], 500);
        }

        // 1-Click Auto Apply
        $cliente = $insight->cliente;
        if ($cliente) {
            $cliente->update([
                'seo_title' => $suggestion['title'],
                'seo_description' => $suggestion['description']
            ]);
        }

        $insight->update([
            'status' => 'resolved',
            'suggested_changes' => json_encode([
                'title' => $suggestion['title'],
                'description' => $suggestion['description']
            ])
        ]);

        return response()->json([
            'message' => 'Otimizado com sucesso!',
            'insight' => $insight,
            'suggestion' => $suggestion
        ]);
    }

    /**
     * Força a varredura (SEO Job) para um cliente específico.
     */
    public function forceScan(Request $request)
    {
        $request->validate([
            'cliente_id' => 'required|integer|exists:clientes,id'
        ]);

        $cliente = Cliente::findOrFail($request->cliente_id);

        if (empty($cliente->slug)) {
            return response()->json([
                'error' => 'Este cliente não possui um Slug (URL) cadastrado para verificar o SEO.'
            ], 400);
        }

        if (!$cliente->exibir_no_site) {
            return response()->json([
                'error' => 'Este cliente não está visível no site principal (exibir_no_site = false).'
            ], 400);
        }

        // Dispara o Job em background
        ProcessClienteSeoJob::dispatch($cliente);

        return response()->json([
            'message' => 'Varredura SEO iniciada com sucesso. Os resultados aparecerão em breve.'
        ]);
    }
}
