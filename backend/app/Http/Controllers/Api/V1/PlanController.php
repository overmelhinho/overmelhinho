<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Services\TinyErpService;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * Listar todos os planos
     */
    public function index()
    {
        return response()->json(Plan::orderBy('name')->get());
    }

    /**
     * Criar um novo plano
     */
    public function store(Request $request, TinyErpService $tinyService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:mensal,anual,avulso',
            'tiny_product_id' => 'nullable|string|max:100',
        ]);

        $plan = Plan::create($validated);

        // Sincroniza automaticamente com o Tiny
        $tinyService->syncPlan($plan);

        return response()->json([
            'message' => 'Plano criado e sincronizado com Tiny!',
            'plan' => $plan->fresh()
        ], 201);
    }

    /**
     * Mostrar detalhes de um plano
     */
    public function show($id)
    {
        return response()->json(Plan::findOrFail($id));
    }

    /**
     * Atualizar um plano
     */
    public function update(Request $request, $id, TinyErpService $tinyService)
    {
        $plan = Plan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'billing_cycle' => 'sometimes|required|in:mensal,anual,avulso',
            'tiny_product_id' => 'nullable|string|max:100',
        ]);

        $plan->update($validated);

        // Atualiza no Tiny também
        $tinyService->syncPlan($plan);

        return response()->json([
            'message' => 'Plano atualizado no sistema e no Tiny!',
            'plan' => $plan->fresh()
        ]);
    }

    /**
     * Sincronizar plano manualmente com o Tiny
     */
    public function sync($id, TinyErpService $tinyService)
    {
        $plan = Plan::findOrFail($id);
        $success = $tinyService->syncPlan($plan);

        if ($success) {
            return response()->json([
                'message' => 'Plano sincronizado com sucesso no Tiny!',
                'plan' => $plan->fresh()
            ]);
        }

        return response()->json([
            'message' => 'Falha ao sincronizar com o Tiny. Verifique os logs.'
        ], 500);
    }

    /**
     * Excluir um plano
     */
    public function destroy($id)
    {
        $plan = Plan::findOrFail($id);

        // Verificar se existem faturas vinculadas (opcional: impedir exclusão ou apenas avisar)
        if ($plan->invoices()->count() > 0) {
            return response()->json([
                'message' => 'Este plano não pode ser excluído pois existem faturas vinculadas a ele. Tente renomeá-lo ou desativá-lo.'
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'message' => 'Plano excluído com sucesso!'
        ]);
    }
}
