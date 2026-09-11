<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SearchCorrection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchCorrectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SearchCorrection::query();

        if ($search = $request->input('search')) {
            $query->where(function($q) use ($search) {
                $q->where('typo', 'ilike', "%{$search}%")
                  ->orWhere('correction', 'ilike', "%{$search}%");
            });
        }

        $corrections = $query->orderBy('hit_count', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->input('per_page', 15));
            
        return response()->json($corrections);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'typo' => 'required|string|max:255|unique:search_corrections,typo',
            'correction' => 'required|string|max:255',
        ]);

        $validated['typo'] = mb_strtolower(trim($validated['typo']), 'UTF-8');
        $validated['correction'] = mb_strtolower(trim($validated['correction']), 'UTF-8');
        $validated['is_verified'] = DB::raw('true');
        $validated['hit_count'] = 0;

        $correction = SearchCorrection::create($validated);

        return response()->json($correction, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $correction = SearchCorrection::findOrFail($id);

        $validated = $request->validate([
            'typo' => 'sometimes|required|string|max:255|unique:search_corrections,typo,' . $id,
            'correction' => 'sometimes|required|string|max:255',
        ]);

        if (isset($validated['typo'])) {
            $validated['typo'] = mb_strtolower(trim($validated['typo']), 'UTF-8');
        }
        
        if (isset($validated['correction'])) {
            $validated['correction'] = mb_strtolower(trim($validated['correction']), 'UTF-8');
        }

        $correction->update($validated);

        return response()->json($correction);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $correction = SearchCorrection::findOrFail($id);
        $correction->delete();

        return response()->json(null, 204);
    }

    /**
     * Get suggestions from search logs (searches with 0 results)
     */
    public function suggestions(Request $request)
    {
        $days = (int) $request->input('days', 30);
        $limit = (int) $request->input('limit', 20);
        
        // Find terms where ALL recent searches yielded 0 results.
        // If a term recently had > 0 results, it's no longer a "failure".
        $suggestions = DB::table('search_logs')
            ->select('term', 
                DB::raw('COUNT(CASE WHEN results_count = 0 THEN 1 END) as total_searches'), 
                DB::raw('MAX(created_at) as last_searched_at')
            )
            ->where('created_at', '>=', now()->subDays($days))
            ->whereNotNull('term')
            ->where('term', '!=', '')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('search_corrections')
                      ->whereRaw('LOWER(search_corrections.typo) = LOWER(search_logs.term)');
            })
            ->groupBy('term')
            ->having(DB::raw('MAX(results_count)'), '=', 0) // Ensures it NEVER had results recently
            ->having(DB::raw('COUNT(CASE WHEN results_count = 0 THEN 1 END)'), '>=', 1)
            ->orderBy('total_searches', 'desc')
            ->limit($limit)
            ->get();

        return response()->json(['data' => $suggestions]);
    }
}
