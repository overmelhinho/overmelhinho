<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Oportunidade;
use App\Http\Resources\OportunidadeResource;
use Illuminate\Http\Request;
use App\Models\Cliente;
use Illuminate\Support\Facades\DB;



class OportunidadeController extends Controller
{
    protected $ticketService;

    public function __construct(\App\Services\TicketService $ticketService)
    {
        $this->ticketService = $ticketService;
    }

    // Kanban: retorna todas agrupadas por etapa
    public function kanban(Request $request)
    {
        $oportunidades = Oportunidade::orderBy('etapa')->orderBy('updated_at', 'desc')->get();
        $grouped = $oportunidades->groupBy('etapa');
        return response()->json($grouped->map(function ($items) {
            return OportunidadeResource::collection($items);
        }));
    }

    public function index(Request $request)
    {
        $query = Oportunidade::query();

        if ($request->filled('etapa')) {
            $query->where('etapa', $request->etapa);
        }
        if ($request->filled('responsavel')) {
            $query->where('responsavel', $request->responsavel);
        }
        // Adicione mais filtros conforme necessário

        return OportunidadeResource::collection($query->orderBy('updated_at', 'desc')->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lead_id' => 'nullable|exists:leads,id',
            'cliente_id' => 'nullable|exists:clientes,id',
            'nome' => 'required|string|max:191',
            'etapa' => 'required|string|max:30',
            'valor_estimado' => 'nullable|numeric',
            'responsavel' => 'nullable|string|max:191',
            'previsao_fechamento' => 'nullable|date',
            'observacoes' => 'nullable|string',
            'origem' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:30',
        ]);
        $oportunidade = Oportunidade::create($data);
        return new OportunidadeResource($oportunidade);
    }

    public function update(Request $request, $id)
    {
        $oportunidade = Oportunidade::findOrFail($id);
        $data = $request->validate([
            'etapa' => 'nullable|string|max:30',
            'valor_estimado' => 'nullable|numeric',
            'responsavel' => 'nullable|string|max:191',
            'previsao_fechamento' => 'nullable|date',
            'observacoes' => 'nullable|string',
            'status' => 'nullable|string|max:30',
        ]);
        $oportunidade->update($data);
        return new OportunidadeResource($oportunidade);
    }

    // Endpoint para movimentar card no kanban (atualiza etapa)
    public function mover(Request $request, $id)
    {
        $oportunidade = Oportunidade::findOrFail($id);
        $request->validate(['etapa' => 'required|string|max:30']);
        $oportunidade->etapa = $request->etapa;
        $oportunidade->save();
        return new OportunidadeResource($oportunidade);
    }

    public function destroy($id)
    {
        $oportunidade = Oportunidade::findOrFail($id);
        $oportunidade->delete();
        return response()->json(['success' => true]);
    }

    public function converterCliente(Request $request, $id)
    {
        $oportunidade = Oportunidade::with('lead')->findOrFail($id);

        // Valide campos obrigatórios para cliente (ajuste conforme necessário)
        $data = $request->validate([
            'nome_fantasia' => 'required|string|max:191',
            'cpf_cnpj' => 'nullable|string|max:30',
            // outros campos do cliente...
        ]);

        return DB::transaction(function () use ($data, $oportunidade) {
            // Cria o cliente a partir dos dados do lead e oportunidade
            $cliente = Cliente::create(array_merge([
                'nome_fantasia' => $data['nome_fantasia'],
                'cpf_cnpj' => $data['cpf_cnpj'] ?? null,
                'razao_social' => $oportunidade->lead->nome ?? null,
                // adicione outros campos migrados do lead/oportunidade...
            ], $data));

            // Atualiza a oportunidade e o lead relacionado
            $oportunidade->cliente_id = $cliente->id;
            $oportunidade->etapa = 'ganho';
            $oportunidade->status = 'ganha';
            $oportunidade->save();

            if ($oportunidade->lead) {
                $oportunidade->lead->update(['status' => 'convertido']);
            }

            // ✅ Automação de Onboarding: Cria ticket de suporte para o novo cliente
            try {
                $this->ticketService->createOnboardingTicket($cliente);
            }
            catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Falha ao criar ticket de onboarding na conversão do cliente #{$cliente->id}: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'cliente' => new \App\Http\Resources\ClienteResource($cliente)
            ]);
        });
    }




}
