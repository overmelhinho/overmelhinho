<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Http\Requests\LeadRequest;
use App\Http\Resources\LeadResource;
use Illuminate\Http\Request;
use App\Models\Oportunidade;
use Illuminate\Support\Facades\Log;
use App\Http\Resources\OportunidadeResource;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);

        $query = Lead::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nome', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('origem', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'Todos') {
            $query->where('status', $status);
        }

        $query->orderBy('created_at', 'desc');

        $leads = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $leads->items(),
            'meta' => [
                'total' => $leads->total(),
                'page' => $leads->currentPage(),
                'per_page' => $leads->perPage(),
                'last_page' => $leads->lastPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $lead = Lead::findOrFail($id);
        return new LeadResource($lead);
    }

    public function store(LeadRequest $request)
    {
        $data = $request->validated();
        \Log::info('[LEAD][STORE][VALIDATED]', $data);

        $lead = Lead::create($data)->fresh();

        return new LeadResource($lead);
    }

    public function update(LeadRequest $request, $id)
    {
        $lead = Lead::findOrFail($id);
        $lead->update($request->only([
            'nome',
            'email',
            'telefone',
            'origem',
            'status',
            'responsavel',
            'observacoes',
            'motivo_perda',
            'data_follow_up'

        ]));
        return new LeadResource($lead);
    }

    public function destroy($id)
    {
        $lead = Lead::findOrFail($id);
        $lead->delete();
        return response()->json(['success' => true]);
    }

    public function converterOportunidade(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);

        $data = $request->validate([
            'nome' => 'required|string|max:191',
            'valor_estimado' => 'nullable|numeric',
            'responsavel' => 'nullable|string|max:191',
            'previsao_fechamento' => 'nullable|date',
            'observacoes' => 'nullable|string',
            'origem' => 'nullable|string|max:100',
        ]);

        $data['lead_id'] = $lead->id;
        $data['etapa'] = 'novo';
        $data['status'] = 'aberta';

        return \Illuminate\Support\Facades\DB::transaction(function () use ($data, $lead) {
            $oportunidade = Oportunidade::create($data);

            $lead->status = 'Qualificado';
            $lead->save();

            return response()->json([
                'success' => true,
                'oportunidade' => new \App\Http\Resources\OportunidadeResource($oportunidade)
            ]);
        });
    }

    public function stats()
    {
        return response()->json([
            'total' => Lead::count(),
            'novo' => Lead::where('status', 'novo')->count(),
            'em_contato' => Lead::where('status', 'em_contato')->count(),
            'convertido' => Lead::where('status', 'convertido')->count(),
            'perdido' => Lead::where('status', 'perdido')->count(),
        ]);
    }
}
